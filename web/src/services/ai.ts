import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { AppSettings } from "../components/SettingsContext";

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
    
    const generationConfig: any = {};
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

    const options: any = {
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
    throw new Error("Invalid response from AI.");
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
    throw new Error("Invalid response from AI.");
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generatePracticeList = async (settings: AppSettings, type: 'speaking' | 'writing', category: string): Promise<any[]> => {
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
      const parsed = JSON.parse(responseText);
      // Fallback in case the model ignored "data" wrapper and returned array directly
      if (Array.isArray(parsed)) return parsed;
      return parsed.data || [];
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      const is429 = msg.includes('429');
      if (is429) {
         if (attempt < 2) {
           await delay(2000 * (attempt + 1));
           continue;
         }
         throw new Error('API rate limit reached. Please wait a moment and try again.');
      }
      console.error("Failed to generate list:", e);
      throw e;
    }
  }
  return [];
}

export const generateSpeakingTranscript = async (settings: AppSettings, title: string, level: string, type: string): Promise<string> => {
  const systemInstruction = `You are a helpful assistant. Return ONLY the raw generated text.`;
  const instruction = `Generate a short English ${type} (about 2-3 sentences) about "${title}" for a ${level} level student to practice speaking (shadowing). Return only the text, no markdown.`;
  
  return callAI(settings, systemInstruction, instruction, false);
};

export class UnifiedChatSession {
  private settings: AppSettings;
  private systemInstruction: string;
  private history: { role: string; content: string }[] = [];
  private geminiChat: any = null;

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
          ...this.history as any
        ]
      });
      
      const reply = response.choices[0].message.content || '';
      this.history.push({ role: 'assistant', content: reply });
      return reply;
    }
  }
}
