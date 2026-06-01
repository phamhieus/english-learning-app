import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { AppSettings } from "../components/settings-context";
import type { Practice } from "./storage";

export interface WritingFeedback {
  score: number;
  bandScore: string;
  overallFeedback: string;
  subScores: {
    taskAchievement: string;
    coherence: string;
    lexicalResource: string;
    grammar: string;
  };
  corrections: { original: string; replacement: string; explanation: string }[];
  improvementTips: string[];
  improvedText: string;
}

export interface SpeakingFeedback {
  score: number;
  pronunciationScore: number;
  fluencyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  feedback: string;
  improvementTips: string[];
}

interface PracticeListResponse {
  data?: Practice[];
}

type GeminiChatSession = ReturnType<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['startChat']>;

const getOpenAIClient = (settings: AppSettings) => {
  if (settings.aiProvider === 'openai') {
    if (!settings.openAiKey) throw new Error("OpenAI API Key is missing");
    return new OpenAI({ apiKey: settings.openAiKey, dangerouslyAllowBrowser: true });
  } else if (settings.aiProvider === 'deepseek') {
    if (!settings.deepseekKey) throw new Error("DeepSeek API Key is missing");
    return new OpenAI({ apiKey: settings.deepseekKey, baseURL: 'https://api.deepseek.com/v1', dangerouslyAllowBrowser: true });
  }
  throw new Error("Invalid OpenAI provider");
};

const callAI = async (settings: AppSettings, systemInstruction: string, userContent: string, isJson: boolean = true): Promise<string> => {
  if (settings.aiProvider === 'gemini') {
    if (!settings.geminiKey) throw new Error("Gemini API Key is missing");
    const genAI = new GoogleGenerativeAI(settings.geminiKey);
    const model = genAI.getGenerativeModel({ 
      model: settings.textModel || "gemini-2.0-flash",
      systemInstruction
    });
    
    const generationConfig: { responseMimeType?: string } = {};
    if (isJson) {
      generationConfig.responseMimeType = "application/json";
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig
    });
    return result.response.text();
  } else {
    const openai = getOpenAIClient(settings);
    
    let model = settings.textModel;
    if (settings.aiProvider === 'openai' && !model.startsWith('gpt') && !model.startsWith('o1')) {
      model = 'gpt-4o-mini';
    } else if (settings.aiProvider === 'deepseek' && !model.startsWith('deepseek')) {
      model = 'deepseek-v4-flash';
    } else if (!model) {
      model = settings.aiProvider === 'openai' ? 'gpt-4o-mini' : 'deepseek-v4-flash';
    }

    const options: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userContent }
      ]
    };
    if (isJson) {
      options.response_format = { type: 'json_object' };
    }

    const response = await openai.chat.completions.create(options);
    
    return response.choices[0].message.content || (isJson ? '{}' : '');
  }
};

export const evaluateWriting = async (settings: AppSettings, prompt: string, text: string): Promise<WritingFeedback> => {
  const systemInstruction = `You are an expert IELTS/TOEIC English writing coach. Evaluate the user's text based on the given prompt.
Return your evaluation strictly as a JSON object matching this schema:
{
  "score": number (0-100 overall score),
  "bandScore": string (e.g. "7.5"),
  "overallFeedback": "string (Short overall feedback on the article)",
  "subScores": {
    "taskAchievement": string (e.g. "7.5"),
    "coherence": string,
    "lexicalResource": string,
    "grammar": string
  },
  "corrections": [
    { "original": "string", "replacement": "string", "explanation": "string (briefly explain why it was added, modified, or deleted)" }
  ],
  "improvementTips": ["string (Suggestions for improvement based on the target band score)"],
  "improvedText": "string (a natural, high-scoring rewrite of the user's text)"
}`;

  const userContent = `Prompt/Topic: ${prompt}\n\nUser's Text:\n${text}`;

  try {
    const responseText = await callAI(settings, systemInstruction, userContent);
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    throw new Error("Invalid response from AI.", { cause: e });
  }
};

export interface ShadowingEvaluation {
  finalScore: number;
  pronunciationScore: number;
  completenessScore: number;
  fluencyScore: number;
  rhythmScore: number;
  intonationScore: number;
  feedback: string;
}

export const evaluateShadowing = async (
  settings: AppSettings,
  targetText: string,
  recognizedText: string,
  audioDurationMs?: number
): Promise<ShadowingEvaluation> => {
  const systemInstruction = `You are an expert English pronunciation and shadowing coach. The user listened to a target sentence and tried to shadow (repeat) it. Their speech was transcribed via Speech-to-Text, which mostly reflects what they actually said (mis-recognized words indicate likely mispronunciation).

Compare the user's recognized text against the target text and return STRICT JSON matching this schema:
{
  "finalScore": number (0-100 overall shadowing score),
  "pronunciationScore": number (0-100, lower if many words were mis-recognized),
  "completenessScore": number (0-100, percentage of target words that appeared),
  "fluencyScore": number (0-100, smoothness — penalize if user said far fewer words than target for the duration),
  "rhythmScore": number (0-100, natural English rhythm/timing — estimate from word coverage and length),
  "intonationScore": number (0-100, pitch variation — estimate similarly),
  "feedback": "string (1-2 concise sentences with the SINGLE most important actionable advice — mention specific words or sounds when possible)"
}

Scoring guidelines (be honest, not lenient):
- 90+ : near-perfect, almost all words correct, smooth
- 75-89: good attempt, a few minor word errors
- 60-74: partial — missed several words or mispronounced enough to confuse STT
- 40-59: weak — missed half or more
- < 40 : barely intelligible
- If recognized text is empty or just 1-2 words for a long target: all scores below 25, finalScore around 0-15
- If recognized text is completely off-topic from target: low pronunciation/completeness, feedback should note it`;

  const userContent = `Target Text:\n"${targetText}"\n\nUser Said (Speech-to-Text):\n"${recognizedText || '(no speech detected)'}"${audioDurationMs ? `\n\nRecording duration: ${(audioDurationMs / 1000).toFixed(1)}s` : ''}`;

  try {
    const responseText = await callAI(settings, systemInstruction, userContent);
    return JSON.parse(responseText);
  } catch (e) {
    console.error('Failed to parse shadowing evaluation:', e);
    throw new Error('Invalid response from AI.', { cause: e });
  }
};

export const evaluateSpeaking = async (settings: AppSettings, transcript: string, recognizedText: string): Promise<SpeakingFeedback> => {
  const systemInstruction = `You are an expert English speaking coach. Evaluate the user's spoken text (which was transcribed via Speech-to-Text) against the target text they were supposed to say.
Return your evaluation strictly as a JSON object matching this schema:
{
  "score": number (0-100 overall score),
  "pronunciationScore": number (0-100, estimate based on how many words were misrecognized),
  "fluencyScore": number (0-100),
  "grammarScore": number (0-100),
  "vocabularyScore": number (0-100),
  "feedback": "string (Short overall feedback on the user's performance)",
  "improvementTips": ["string (Actionable tips to improve speaking score)"]
}`;

  const userContent = `Target Text: ${transcript}\n\nUser Actually Said (Speech-to-Text output): ${recognizedText}`;

  try {
    const responseText = await callAI(settings, systemInstruction, userContent);
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    throw new Error("Invalid response from AI.", { cause: e });
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generatePracticeList = async (settings: AppSettings, type: 'speaking' | 'writing', category: string): Promise<Practice[]> => {
  const schema = type === 'speaking' ? `
  [
    { "id": number (unique random), "title": "string", "duration": "string", "level": "Easy|Medium|Hard", "type": "string", "focus": "string" }
  ]` : `
  [
    { "id": number (unique random), "title": "string", "duration": "string", "level": "Easy|Medium|Hard", "type": "string" }
  ]`;

  const systemInstruction = `You are a helpful assistant. Return ONLY a JSON object with a single key "data" containing an array of practice items.`;
  const instruction = `Generate a list of 4 realistic ${category} English practice exercises for a learning app. Return only raw JSON matching this schema: { "data": ${schema} }. No markdown wrappers.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const responseText = await callAI(settings, systemInstruction, instruction);
      const parsed: Practice[] | PracticeListResponse = JSON.parse(responseText);
      // Fallback in case the model ignored "data" wrapper and returned array directly
      if (Array.isArray(parsed)) return parsed;
      return parsed.data || [];
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      const is429 = msg.includes('429');
      if (is429) {
         if (attempt < 2) {
           await delay(2000 * (attempt + 1));
           continue;
         }
         throw new Error('API rate limit reached. Please wait a moment and try again.', { cause: e });
      }
      console.error("Failed to generate list:", e);
      throw new Error('Failed to generate practice list.', { cause: e });
    }
  }
  return [];
}

export const generateSpeakingTranscript = async (settings: AppSettings, title: string, level: string, type: string): Promise<string> => {
  const systemInstruction = `You are a helpful assistant. Return ONLY the raw generated text.`;
  const instruction = `Generate a short English ${type} (about 2-3 sentences) about "${title}" for a ${level} level student to practice speaking (shadowing). Return only the text, no markdown.`;
  
  return callAI(settings, systemInstruction, instruction, false);
};

export interface PictureDescriptionFeedback {
  score: number;
  contentScore: number;
  vocabularyScore: number;
  grammarScore: number;
  fluencyScore: number;
  feedback: string;
  keyElementsMissed: string[];
  improvementTips: string[];
  sampleDescription: string;
}

export const evaluatePictureDescription = async (
  settings: AppSettings,
  imageTitle: string,
  userDescription: string
): Promise<PictureDescriptionFeedback> => {
  const systemInstruction = `You are an expert TOEIC/IELTS English speaking coach specializing in picture description tasks.
The user was shown a picture titled/depicting: "${imageTitle}".
They described it verbally and their speech was transcribed via Speech-to-Text.

Evaluate their description and return STRICT JSON matching this schema:
{
  "score": number (0-100 overall score),
  "contentScore": number (0-100, how well they described key elements visible in such a picture),
  "vocabularyScore": number (0-100, range and accuracy of vocabulary used),
  "grammarScore": number (0-100, grammatical correctness),
  "fluencyScore": number (0-100, natural flow and coherence of description),
  "feedback": "string (2-3 sentences of overall feedback)",
  "keyElementsMissed": ["string (key visual elements they should have mentioned but didn't)"],
  "improvementTips": ["string (specific actionable tips to improve picture description skills)"],
  "sampleDescription": "string (a model Band 7+ description of this picture, 3-5 sentences)"
}

Scoring guidelines:
- 90+: Comprehensive description covering all key elements with varied vocabulary and perfect grammar
- 75-89: Good description with most key elements, minor vocabulary/grammar issues
- 60-74: Adequate but missing some important elements or notable grammar errors
- 40-59: Basic description, limited vocabulary, several errors
- <40: Very brief or off-topic description
- If the transcribed text is empty or just 1-2 words: all scores below 20`;

  const userContent = `Picture: ${imageTitle}\n\nUser's Description (Speech-to-Text):\n"${userDescription || '(no speech detected)'}"`;

  try {
    const responseText = await callAI(settings, systemInstruction, userContent);
    return JSON.parse(responseText);
  } catch (e) {
    console.error('Failed to parse picture description evaluation:', e);
    throw new Error('Invalid response from AI.', { cause: e });
  }
};

export const generatePictureDescriptions = async (
  settings: AppSettings,
  category: string
): Promise<{ id: number; title: string; imageUrl: string; level: string; duration: string; category: string }[]> => {
  const systemInstruction = `You are a helpful assistant. Return ONLY a JSON object with a single key "data" containing an array of picture description practice items.`;
  const instruction = `Generate 6 picture description practice items for the category "${category}" for an English learning app (TOEIC/IELTS style).
Each item should have a realistic scene that could appear in a TOEIC photo description test.
Return only raw JSON matching this schema:
{
  "data": [
    {
      "id": number (unique random 5-digit),
      "title": "string (short description of what the picture shows)",
      "imageUrl": "string (a valid Unsplash URL like https://images.unsplash.com/photo-XXXX?w=800&h=500&fit=crop)",
      "level": "Easy|Medium|Hard",
      "duration": "string (e.g. '2 min')",
      "category": "${category}"
    }
  ]
}
No markdown wrappers.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const responseText = await callAI(settings, systemInstruction, instruction);
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) return parsed;
      return parsed.data || [];
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('429') && attempt < 2) {
        await delay(2000 * (attempt + 1));
        continue;
      }
      console.error('Failed to generate picture descriptions:', e);
      throw new Error('Failed to generate picture description list.', { cause: e });
    }
  }
  return [];
};

export class UnifiedChatSession {
  private settings: AppSettings;
  private systemInstruction: string;
  private history: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  private geminiChat: GeminiChatSession | null = null;

  constructor(settings: AppSettings, systemInstruction: string) {
    this.settings = settings;
    this.systemInstruction = systemInstruction;

    if (settings.aiProvider === 'gemini') {
      if (!settings.geminiKey) throw new Error("Gemini API Key is missing");
      const genAI = new GoogleGenerativeAI(settings.geminiKey);
      const model = genAI.getGenerativeModel({ 
        model: settings.textModel || "gemini-2.0-flash",
        systemInstruction
      });
      this.geminiChat = model.startChat();
    }
  }

  async sendMessage(text: string): Promise<string> {
    if (this.settings.aiProvider === 'gemini') {
      if (!this.geminiChat) throw new Error("Gemini chat session is not initialized");
      const result = await this.geminiChat.sendMessage(text);
      return result.response.text();
    } else {
      const openai = getOpenAIClient(this.settings);
      
      let model = this.settings.textModel;
      if (this.settings.aiProvider === 'openai' && !model.startsWith('gpt') && !model.startsWith('o1')) {
        model = 'gpt-4o-mini';
      } else if (this.settings.aiProvider === 'deepseek' && !model.startsWith('deepseek')) {
        model = 'deepseek-v4-flash';
      } else if (!model) {
        model = this.settings.aiProvider === 'openai' ? 'gpt-4o-mini' : 'deepseek-v4-flash';
      }

      this.history.push({ role: 'user', content: text });
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: this.systemInstruction },
          ...this.history
        ]
      });
      
      const reply = response.choices[0].message.content || '';
      this.history.push({ role: 'assistant', content: reply });
      return reply;
    }
  }
}
