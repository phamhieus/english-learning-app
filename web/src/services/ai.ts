import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { AppSettings, AIProvider } from "../components/settings-context";
import type { Practice } from "./storage";
import { runInstalledAiPrompt } from "./local-ai-helper";

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

// Every provider except Gemini speaks the OpenAI chat-completions protocol, so
// they all run through the OpenAI SDK with a provider-specific baseURL + key.
// Adding a new OpenAI-compatible provider is just one entry here.
type OpenAICompatProvider = Exclude<AIProvider, 'gemini'>;

const OPENAI_COMPAT: Record<OpenAICompatProvider, {
  label: string;
  keyField: keyof AppSettings;
  baseURL?: string;
  defaultModel: string;
  prefixes: string[];
}> = {
  openai:   { label: 'OpenAI',          keyField: 'openAiKey',   defaultModel: 'gpt-4o-mini',  prefixes: ['gpt', 'o1', 'o3', 'o4', 'chatgpt'] },
  deepseek: { label: 'DeepSeek',        keyField: 'deepseekKey', baseURL: 'https://api.deepseek.com/v1',                  defaultModel: 'deepseek-chat',  prefixes: ['deepseek'] },
  grok:     { label: 'xAI (Grok)',      keyField: 'grokKey',     baseURL: 'https://api.x.ai/v1',                          defaultModel: 'grok-3-mini',    prefixes: ['grok'] },
  qwen:     { label: 'Qwen',            keyField: 'qwenKey',     baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-plus', prefixes: ['qwen', 'qwq'] },
  moonshot: { label: 'Moonshot (Kimi)', keyField: 'moonshotKey', baseURL: 'https://api.moonshot.cn/v1',                   defaultModel: 'moonshot-v1-8k', prefixes: ['moonshot', 'kimi'] },
  zhipu:    { label: 'Zhipu (GLM)',     keyField: 'zhipuKey',    baseURL: 'https://open.bigmodel.cn/api/paas/v4',         defaultModel: 'glm-4-flash',    prefixes: ['glm'] },
};

const getOpenAIClient = (settings: AppSettings) => {
  const cfg = OPENAI_COMPAT[settings.aiProvider as OpenAICompatProvider];
  if (!cfg) throw new Error("Invalid OpenAI-compatible provider");
  const key = (settings[cfg.keyField] as string) || '';
  if (!key) throw new Error(`${cfg.label} API Key is missing`);
  return new OpenAI({ apiKey: key, baseURL: cfg.baseURL, dangerouslyAllowBrowser: true });
};

// Pick a valid model id for the active provider, falling back to its default
// if the stored model belongs to a different provider (e.g. after switching).
const resolveOpenAIModel = (settings: AppSettings): string => {
  const cfg = OPENAI_COMPAT[settings.aiProvider as OpenAICompatProvider];
  if (!cfg) return settings.textModel || 'gpt-4o-mini';
  const m = settings.textModel;
  return m && cfg.prefixes.some((p) => m.startsWith(p)) ? m : cfg.defaultModel;
};

// Reasoning-style models reject the `json_object` response_format (and o1-mini
// also rejects a system role). For those we ask for JSON via the prompt only.
const modelSupportsJsonMode = (model: string): boolean => {
  const m = model.toLowerCase();
  if (m.includes('reasoner')) return false; // deepseek-reasoner (R1)
  if (m === 'o1-mini' || m === 'o1-preview') return false;
  return true;
};

// Newer/reasoning models often wrap JSON in ```json fences even in JSON tasks —
// strip them so JSON.parse downstream stays happy across every provider.
const stripJsonFences = (text: string): string => {
  const t = text.trim();
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced ? fenced[1] : t).trim();
};

// Installed AI runtime: a single combined prompt is handed to a local CLI tool
// (Codex/Gemini/Claude) which prints its answer. There is no separate system
// channel, so we prepend the system instruction to the user content.
const buildInstalledPrompt = (systemInstruction: string, userContent: string): string =>
  `${systemInstruction}\n\n${userContent}`;

const callInstalledAI = async (settings: AppSettings, systemInstruction: string, userContent: string, isJson: boolean): Promise<string> => {
  if (!settings.selectedInstalledToolId) {
    throw new Error('No installed AI tool is selected.');
  }
  const output = await runInstalledAiPrompt(
    settings.selectedInstalledToolId,
    buildInstalledPrompt(systemInstruction, userContent),
  );
  return isJson ? stripJsonFences(output) : output;
};

const callAI = async (settings: AppSettings, systemInstruction: string, userContent: string, isJson: boolean = true): Promise<string> => {
  if (settings.aiRuntimeType === 'installed') {
    return callInstalledAI(settings, systemInstruction, userContent, isJson);
  }

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

    const model = resolveOpenAIModel(settings);
    const options: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userContent }
      ]
    };
    if (isJson && modelSupportsJsonMode(model)) {
      options.response_format = { type: 'json_object' };
    }

    const response = await openai.chat.completions.create(options);

    const content = response.choices[0].message.content || (isJson ? '{}' : '');
    return isJson ? stripJsonFences(content) : content;
  }
};

const buildScoringInstruction = (exam: string, taskKey: string, prompt: string): string => {
  if (exam === 'TOEIC') {
    return `Target exam: TOEIC Writing.
Use TOEIC Speaking/Writing style scoring. The overall "score" is 0-100 for the app UI.
The "bandScore" field must be a TOEIC scaled writing score string from 0-200, for example "160/200". Do not return IELTS bands.
Sub-score fields should be TOEIC-style 0-100 strings, for example "82/100".
Score conservatively like a real test rater: do not give high scores to short, generic, off-task, poorly organized, or template-like responses.`;
  }

  const base = `Target exam: IELTS Writing.
Use IELTS band scoring (0–9). The overall "score" is 0-100 for the app UI.
The "bandScore" field must be an IELTS band string, for example "6.5". Sub-score fields must also be IELTS band strings, for example "6.0".
Apply strict real-examiner calibration:
  - Band 7+ requires clear task fulfilment, well-developed ideas, flexible cohesion, precise vocabulary, and mostly error-free grammar.
  - Do not give band 7+ to writing that is merely understandable but thin, generic, repetitive, underdeveloped, or template-like.
  - Under-length responses must be capped conservatively even if grammar is good.
  - Penalize memorised introductions, list-like paragraphs, unsupported claims, missing task elements, weak paragraphing, and vague examples.
  - If task response/achievement is capped, the overall band should not exceed the cap by more than 0.5.`;

  if (taskKey === 't1a') {
    return `${base}
Task type: IELTS Academic Writing Task 1 (visual data — chart, graph, table, map, or process diagram).
Minimum word count: 150 words. Deduct at least one band from taskAchievement if under 150 words.
Scoring for taskAchievement (Task Achievement):
  - MUST include a clear overview sentence summarising the most significant trend or feature. No overview = maximum band 5.
  - MUST select and accurately report the most relevant data — not every single number.
  - MUST make meaningful comparisons between categories, time periods, or groups.
  - Personal opinions, arguments, or unsupported conclusions beyond the data should NOT be rewarded.
  - A report with no clear comparisons should not exceed band 6 for taskAchievement.
Scoring for lexicalResource: reward accurate use of trend language (rose steadily, peaked at, fluctuated, remained stable, etc.).`;
  }

  if (taskKey === 't1g') {
    const lower = prompt.toLowerCase();
    let registerType = 'Semi-formal';
    let registerRules = 'Uses recipient name (Dear [Name]), respectful but warm tone, minimal contractions, closing with Regards or Best regards.';
    if (lower.includes('write a letter to your friend') || lower.includes('write a letter to a friend') || lower.includes('write a letter to your relative')) {
      registerType = 'Informal';
      registerRules = 'Uses first name (Hi [Name] / Dear [Name]), contractions allowed, warm and personal language, friendly closing (Best wishes / Take care / Love).';
    } else if (
      lower.includes('company') || lower.includes('organisation') || lower.includes('organization') ||
      lower.includes('hotel') || lower.includes('transport') || lower.includes('gym') ||
      lower.includes('provider') || lower.includes('manager') && !lower.includes('building manager')
    ) {
      registerType = 'Formal';
      registerRules = 'No contractions, Dear Sir/Madam (unknown recipient) or Dear Mr/Ms [Surname] (known), Yours faithfully (Dear Sir/Madam) or Yours sincerely (named recipient), professional vocabulary throughout.';
    }
    return `${base}
Task type: IELTS General Writing Task 1 (${registerType} Letter).
Minimum word count: 150 words. Deduct at least one band from taskAchievement if under 150 words.
Expected register: ${registerType}. ${registerRules}
Scoring for taskAchievement (Task Achievement):
  - ALL bullet points must be fully addressed and sufficiently developed. Any bullet point that is missing or only mentioned in passing = maximum band 5.
  - Register must be consistently ${registerType} throughout the letter. Inconsistent or incorrect register reduces the band.
  - Letter must have a clear purpose in the opening paragraph and an appropriate closing salutation.
  - An essay-style response without letter format should NOT receive a high band.
  - A letter with missing opening/closing conventions should not exceed band 5.5 for taskAchievement.
In overallFeedback: explicitly state (1) whether the register is correct and consistent, and (2) which bullet points, if any, are missing or underdeveloped.`;
  }

  if (taskKey === 't2') {
    return `${base}
Task type: IELTS Writing Task 2 (Essay).
Minimum word count: 250 words. Deduct at least one band from taskAchievement if under 250 words.
Scoring for taskAchievement (Task Response in IELTS Task 2 terminology):
  - The essay must clearly address the specific task type stated in the prompt (Agree/Disagree, Discuss Both Views + Opinion, Advantages/Disadvantages Outweigh, Problem-Solution, Cause-Solution, Positive/Negative Development, etc.).
  - Agree/Disagree: a clear, consistent position must be stated and supported throughout. A position that keeps shifting reduces the band.
  - Discuss Both Views + Opinion: BOTH views must be presented before giving a personal opinion. Missing either view = maximum band 5.
  - Outweigh essays: the writer must state whether advantages/benefits outweigh disadvantages/drawbacks and defend that position.
  - Arguments must be fully extended and supported with specific reasons or examples — not just listed.
  - No bullet-point lists, memorised templates, or off-topic content.
  - A Task 2 essay without a clear position, specific examples, and developed body paragraphs should not exceed band 6 for taskResponse.
  - Fewer than 4 logical paragraphs is usually a coherence weakness and should not receive a high cohesion band.`;
  }

  return base;
};

const countWritingWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

const countParagraphs = (text: string): number =>
  text.split(/\n\s*\n|\r\n\s*\r\n/).map((part) => part.trim()).filter((part) => part.length > 0).length;

const parseIeltsBand = (value: string | number | undefined | null): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const formatIeltsBand = (value: number): string =>
  roundToNearestHalf(Math.max(0, Math.min(9, value))).toFixed(1);

const hasAnyPattern = (text: string, patterns: RegExp[]): boolean => {
  const normalized = text.toLowerCase();
  return patterns.some((pattern) => pattern.test(normalized));
};

const IELTS_T1_OVERVIEW_PATTERNS = [
  /\boverall\b/i,
  /\bin general\b/i,
  /\bit is clear\b/i,
  /\bit can be seen\b/i,
  /\bthe main (trend|feature)\b/i,
  /\bthe most (noticeable|significant|striking)\b/i,
];

const IELTS_COMPARISON_PATTERNS = [
  /\bcompared with\b/i,
  /\bwhereas\b/i,
  /\bwhile\b/i,
  /\bin contrast\b/i,
  /\bon the other hand\b/i,
  /\bhigher than\b/i,
  /\blower than\b/i,
  /\bmore than\b/i,
  /\bless than\b/i,
];

const IELTS_T2_POSITION_PATTERNS = [
  /\bi (strongly )?(agree|disagree|believe|think|argue)\b/i,
  /\bin my opinion\b/i,
  /\bmy view is\b/i,
  /\bthis essay (will )?(argues|argue)\b/i,
  /\bi support\b/i,
];

const IELTS_EXAMPLE_REASON_PATTERNS = [
  /\bfor example\b/i,
  /\bfor instance\b/i,
  /\bsuch as\b/i,
  /\bbecause\b/i,
  /\bdue to\b/i,
  /\bas a result\b/i,
  /\btherefore\b/i,
];

const LETTER_OPENING_PATTERNS = [
  /\bdear\b/i,
  /\bhi\b/i,
  /\bhello\b/i,
];

const LETTER_CLOSING_PATTERNS = [
  /\byours faithfully\b/i,
  /\byours sincerely\b/i,
  /\bbest regards\b/i,
  /\bkind regards\b/i,
  /\bbest wishes\b/i,
  /\bsee you\b/i,
  /\btake care\b/i,
];

function calibrateIeltsWritingResult(result: WritingFeedback, text: string, taskKey: string): WritingFeedback {
  const wordCount = countWritingWords(text);
  const paragraphCount = countParagraphs(text);
  const minWords = taskKey === 't2' ? 250 : taskKey === 't1a' || taskKey === 't1g' ? 150 : 0;
  const taskBand = parseIeltsBand(result.subScores?.taskAchievement);
  const coherenceBand = parseIeltsBand(result.subScores?.coherence);
  const lexicalBand = parseIeltsBand(result.subScores?.lexicalResource);
  const grammarBand = parseIeltsBand(result.subScores?.grammar);

  if ([taskBand, coherenceBand, lexicalBand, grammarBand].some((band) => band == null)) {
    return result;
  }

  let taskCap = 9;
  let coherenceCap = 9;
  let lexicalCap = 9;
  let grammarCap = 9;
  const notes: string[] = [];

  if (minWords > 0) {
    if (wordCount < minWords * 0.55) {
      taskCap = Math.min(taskCap, 4.5);
      coherenceCap = Math.min(coherenceCap, 5);
      lexicalCap = Math.min(lexicalCap, 5);
      grammarCap = Math.min(grammarCap, 5);
      notes.push(`Severely under length (${wordCount}/${minWords} words).`);
    } else if (wordCount < minWords * 0.75) {
      taskCap = Math.min(taskCap, 5);
      coherenceCap = Math.min(coherenceCap, 5.5);
      lexicalCap = Math.min(lexicalCap, 6);
      grammarCap = Math.min(grammarCap, 6);
      notes.push(`Substantially under length (${wordCount}/${minWords} words).`);
    } else if (wordCount < minWords) {
      taskCap = Math.min(taskCap, 5.5);
      coherenceCap = Math.min(coherenceCap, 6);
      lexicalCap = Math.min(lexicalCap, 6.5);
      grammarCap = Math.min(grammarCap, 6.5);
      notes.push(`Under the minimum word count (${wordCount}/${minWords} words).`);
    }
  }

  if (taskKey === 't1a') {
    if (!hasAnyPattern(text, IELTS_T1_OVERVIEW_PATTERNS)) {
      taskCap = Math.min(taskCap, 5);
      notes.push('No clear Task 1 overview detected.');
    }
    if (!hasAnyPattern(text, IELTS_COMPARISON_PATTERNS)) {
      taskCap = Math.min(taskCap, 6);
      coherenceCap = Math.min(coherenceCap, 6);
      notes.push('Few clear comparisons detected.');
    }
  }

  if (taskKey === 't1g') {
    if (!hasAnyPattern(text, LETTER_OPENING_PATTERNS) || !hasAnyPattern(text, LETTER_CLOSING_PATTERNS)) {
      taskCap = Math.min(taskCap, 5.5);
      coherenceCap = Math.min(coherenceCap, 6);
      notes.push('Letter opening or closing convention appears weak or missing.');
    }
  }

  if (taskKey === 't2') {
    if (paragraphCount < 4) {
      coherenceCap = Math.min(coherenceCap, 5.5);
      taskCap = Math.min(taskCap, 6);
      notes.push(`Only ${paragraphCount} clear paragraph(s) detected.`);
    }
    if (!hasAnyPattern(text, IELTS_T2_POSITION_PATTERNS)) {
      taskCap = Math.min(taskCap, 6);
      notes.push('No clear personal position detected.');
    }
    if (!hasAnyPattern(text, IELTS_EXAMPLE_REASON_PATTERNS)) {
      taskCap = Math.min(taskCap, 6);
      coherenceCap = Math.min(coherenceCap, 6);
      notes.push('Arguments lack clear reasons or examples.');
    }
  }

  const developmentPenalty = minWords > 0 && wordCount < minWords * 1.08 ? 0.5 : 0;
  const calibrated = {
    taskAchievement: roundToNearestHalf(Math.min((taskBand ?? 0) - developmentPenalty, taskCap)),
    coherence: roundToNearestHalf(Math.min((coherenceBand ?? 0) - developmentPenalty, coherenceCap)),
    lexicalResource: roundToNearestHalf(Math.min((lexicalBand ?? 0) - developmentPenalty * 0.5, lexicalCap)),
    grammar: roundToNearestHalf(Math.min((grammarBand ?? 0) - developmentPenalty * 0.5, grammarCap)),
  };
  const overallCap = Math.min(9, calibrated.taskAchievement + 0.5);
  const overall = roundToNearestHalf(Math.min(
    (calibrated.taskAchievement + calibrated.coherence + calibrated.lexicalResource + calibrated.grammar) / 4,
    overallCap,
  ));

  return {
    ...result,
    score: Math.round((overall / 9) * 100),
    bandScore: formatIeltsBand(overall),
    overallFeedback: notes.length > 0
      ? `${result.overallFeedback} Examiner calibration: ${notes.join(' ')}`
      : result.overallFeedback,
    subScores: {
      taskAchievement: formatIeltsBand(calibrated.taskAchievement),
      coherence: formatIeltsBand(calibrated.coherence),
      lexicalResource: formatIeltsBand(calibrated.lexicalResource),
      grammar: formatIeltsBand(calibrated.grammar),
    },
    improvementTips: notes.length > 0
      ? [...notes.slice(0, 2), ...(result.improvementTips ?? [])].slice(0, 5)
      : result.improvementTips,
  };
}

export const evaluateWriting = async (settings: AppSettings, prompt: string, text: string, taskKey = ''): Promise<WritingFeedback> => {
  const exam = settings.primaryExam;
  const scoringInstruction = buildScoringInstruction(exam, taskKey, prompt);

  const systemInstruction = `You are an expert ${exam} English writing coach. Evaluate the user's writing based on the given prompt and task type.
${scoringInstruction}
Return your evaluation strictly as a JSON object matching this schema:
{
  "score": number (0-100 overall score),
  "bandScore": string (${exam === 'TOEIC' ? 'TOEIC scaled score, e.g. "160/200"' : 'IELTS band, e.g. "6.5"'}),
  "overallFeedback": "string (2-3 sentences of overall feedback, including register and bullet-point coverage for letters)",
  "subScores": {
    "taskAchievement": string (${exam === 'TOEIC' ? 'e.g. "82/100"' : 'IELTS band, e.g. "6.0"'}),
    "coherence": string,
    "lexicalResource": string,
    "grammar": string
  },
  "corrections": [
    { "original": "string", "replacement": "string", "explanation": "string (briefly explain the error and the fix)" }
  ],
  "improvementTips": ["string (3-5 specific, actionable tips based on the task type and the user's actual errors)"],
  "improvedText": "string (a natural, high-scoring rewrite that matches the correct task format and register)"
}`;

  const userContent = `Prompt/Topic: ${prompt}\n\nUser's Text:\n${text}`;

  try {
    const responseText = await callAI(settings, systemInstruction, userContent);
    const parsed: WritingFeedback = JSON.parse(responseText);
    return exam === 'IELTS' ? calibrateIeltsWritingResult(parsed, text, taskKey) : parsed;
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
  "pronunciationScore": number (0-100, based on word-by-word matches; give partial credit for close-sounding words),
  "completenessScore": number (0-100, percentage of target words that were attempted or appeared),
  "fluencyScore": number (0-100, smoothness — penalize if user said far fewer words than target for the duration),
  "rhythmScore": number (0-100, natural English rhythm/timing — estimate from word coverage and length),
  "intonationScore": number (0-100, pitch variation — estimate similarly),
  "feedback": "string (1-2 concise sentences with the SINGLE most important actionable advice — mention specific words or sounds when possible)"
}

Scoring guidelines:
- Score word by word. Do not fail the whole sentence because of one wrong or missing word.
- A single wrong word in an otherwise correct sentence should usually stay around 80-90, depending on sentence length.
- Close-sounding substitutions should receive partial credit, not zero.
- Preserve credit for correct words before and after an error.
- 90+ : near-perfect, almost all words correct, smooth
- 75-89: good attempt, a few word-level errors
- 60-74: partial — several missed or unclear words, but the sentence is still recognizable
- 40-59: weak — about half the target words are missing or unclear
- < 40 : barely intelligible or mostly unrelated
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
  const exam = settings.primaryExam;
  const systemInstruction = `You are an expert ${exam} English speaking coach. Evaluate the user's spoken text (which was transcribed via Speech-to-Text) against the target text they were supposed to say.
Target exam: ${exam}. Use ${exam === 'TOEIC' ? 'TOEIC Speaking style criteria and do not mention IELTS bands.' : 'IELTS Speaking style criteria and band-oriented feedback.'}
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
  const exam = settings.primaryExam;
  const systemInstruction = `You are an expert ${exam} English speaking coach specializing in picture description tasks.
Target exam: ${exam}. Use ${exam === 'TOEIC' ? 'TOEIC picture-description scoring criteria. Do not mention IELTS bands or "Band 7+".' : 'IELTS-style descriptive speaking criteria.'}
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
  "sampleDescription": "string (a model ${exam === 'TOEIC' ? 'high-scoring TOEIC' : 'Band 7+'} description of this picture, 3-5 sentences)"
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

// ── IELTS Speaking Part 1 ────────────────────────────────────────────────────

/** Round a number to the nearest 0.5 (IELTS band rounding). */
export const roundToNearestHalf = (value: number): number =>
  Math.round(value * 2) / 2;

const countIeltsWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

const clampIeltsBand = (value: number, maxBand = 9): number =>
  roundToNearestHalf(Math.max(0, Math.min(value, maxBand)));

export interface IeltsP1AnswerInput {
  questionId: string;
  question: string;
  topicName: string;
  transcript: string;
  durationSeconds: number;
}

export interface IeltsP1DetectedIssue {
  type: 'fluency' | 'vocabulary' | 'grammar' | 'pronunciation' | 'relevance' | 'structure' | 'coverage';
  originalText?: string;
  correctedText?: string;
  message: string;
}

export interface IeltsP1PronunciationWord {
  word: string;
  issue?: string;
}

export interface IeltsP1CoachingInsight {
  key: string;
  label: string;
  value?: string | number | boolean | null;
  message?: string;
}

export interface IeltsP1CriterionResult {
  estimatedBand: number | null;
  strengths: string[];
  issues: string[];
  usefulAlternatives?: string[];
  improvementTip?: string;
}

export interface IeltsP1QuestionResult {
  questionId: string;
  question: string;
  topicName: string;
  transcript: string;
  durationSeconds: number;
  quickScore: number | null;
  detectedIssues: IeltsP1DetectedIssue[];
  correctedTranscript: string;
  improvedAnswer: string;
  pronunciationWords: IeltsP1PronunciationWord[];
}

export interface IeltsP1SessionResult {
  sessionTitle: string;
  mode: string;
  durationSeconds: number;
  topicCount: number;
  questionCount: number;
  estimatedBand: number | null;
  disclaimer: string;
  criteria: {
    fluencyCoherence: IeltsP1CriterionResult;
    lexicalResource: IeltsP1CriterionResult;
    grammaticalRangeAccuracy: IeltsP1CriterionResult;
    pronunciation: IeltsP1CriterionResult;
  };
  coachingInsights: IeltsP1CoachingInsight[];
  questionResults: IeltsP1QuestionResult[];
  keyStrengths: string[];
  priorityImprovements: string[];
}

export const evaluateIeltsP1Session = async (
  settings: AppSettings,
  answers: IeltsP1AnswerInput[],
  durationSeconds: number,
): Promise<IeltsP1SessionResult> => {
  const qBlock = answers
    .map(
      (a, i) =>
        `Q${i + 1} [${a.topicName}]: ${a.question}\nAnswer (${a.durationSeconds}s): ${a.transcript || '(no speech detected)'}`,
    )
    .join('\n\n');

  const topicNames = [...new Set(answers.map((a) => a.topicName))];

  const systemInstruction = `You are an expert IELTS Speaking examiner evaluating a Part 1 practice session.
Score on the 4 official criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.
Each criterion band: 0–9 in 0.5 increments.
estimatedBand = roundToNearestHalf((fc + lr + gra + p) / 4). Return null for any criterion where insufficient data exists.

Return STRICT JSON — no markdown wrappers, no trailing commas:
{
  "sessionTitle": "IELTS Speaking Part 1 — Practice Session",
  "estimatedBand": number | null,
  "disclaimer": "This is an AI-generated estimate for practice purposes. It is not an official IELTS score.",
  "keyStrengths": ["string"],
  "priorityImprovements": ["string"],
  "criteria": {
    "fluencyCoherence": {
      "estimatedBand": number | null,
      "strengths": ["string"],
      "issues": ["string"],
      "improvementTip": "string"
    },
    "lexicalResource": {
      "estimatedBand": number | null,
      "strengths": ["string"],
      "issues": ["string"],
      "usefulAlternatives": ["string"],
      "improvementTip": "string"
    },
    "grammaticalRangeAccuracy": {
      "estimatedBand": number | null,
      "strengths": ["string"],
      "issues": ["string"],
      "improvementTip": "string"
    },
    "pronunciation": {
      "estimatedBand": number | null,
      "strengths": ["string"],
      "issues": ["string"],
      "improvementTip": "string"
    }
  },
  "coachingInsights": [
    { "key": "answer_relevance",     "label": "Answer Relevance",     "value": "good|needs_work|poor", "message": "string" },
    { "key": "answer_development",   "label": "Answer Development",   "value": "good|needs_work|poor", "message": "string" },
    { "key": "long_pauses",          "label": "Long Pauses",          "value": number (count),         "message": "string" },
    { "key": "repeated_vocabulary",  "label": "Repeated Vocabulary",  "value": ["word1","word2"],      "message": "string" },
    { "key": "grammar_accuracy",     "label": "Grammar Accuracy",     "value": "good|needs_work|poor", "message": "string" }
  ],
  "questionResults": [
    {
      "questionId": "string",
      "question": "string",
      "topicName": "string",
      "transcript": "string",
      "durationSeconds": number,
      "quickScore": number | null,
      "detectedIssues": [
        { "type": "fluency|vocabulary|grammar|pronunciation|relevance|structure|coverage", "originalText": "string?", "correctedText": "string?", "message": "string" }
      ],
      "correctedTranscript": "string (fix grammar/word-choice, keep meaning)",
      "improvedAnswer": "string (natural band-7 reference answer)",
      "pronunciationWords": [
        { "word": "string", "issue": "string?" }
      ]
    }
  ]
}

Band guidelines:
- 9: Expert. Near-native fluency, wide vocabulary, precise grammar, clear pronunciation.
- 8: Very good. Minor slips only, almost no impact on communication.
- 7: Good. Some errors but communication is effective throughout.
- 6: Competent. Noticeable errors; communication is maintained with some effort.
- 5: Modest. Frequent errors; meaning sometimes unclear.
- 4: Limited. Basic vocabulary and grammar; frequent breakdowns.
- Below 4: Very limited or no speech detected.

Apply strict IELTS Part 1 calibration:
- Do not reward short but understandable answers too highly. A mostly simple one-sentence answer should usually be band 5.0-6.0.
- Band 7 requires most answers to be developed beyond the minimum, with clear topic vocabulary, natural linking, and only occasional grammar/vocabulary errors.
- Band 8 requires consistently extended, natural, precise answers across the session; do not give band 8 for merely fluent basic language.
- If average answer length is under 12 words or many answers are under 6 seconds, maximum overall band is 5.0.
- If average answer length is under 20 words, maximum overall band is 6.0 unless the answers are unusually precise and error-free.
- If 40% or more answers are very short, incomplete, or generic, maximum overall band is 5.5.
- Penalize repetition, memorised templates, vague answers, missing direct answers, and answers that do not address the question.

If a transcript is empty or "(no speech detected)": quickScore = null, add a "relevance" detectedIssue.
Never fabricate a score when data is insufficient — use null.`;

  const userContent = `Session duration: ${durationSeconds}s\nTopics: ${topicNames.join(', ')}\nQuestion count: ${answers.length}\n\n${qBlock}\n\nReturn the full JSON evaluation.`;

  try {
    const raw = await callAI(settings, systemInstruction, userContent);
    const parsed: IeltsP1SessionResult = JSON.parse(raw);

    // Enforce rounding on all bands (AI may return un-rounded values)
    const roundBand = (b: number | null) => b != null ? roundToNearestHalf(b) : null;
    if (parsed.estimatedBand != null) parsed.estimatedBand = roundBand(parsed.estimatedBand);
    for (const key of ['fluencyCoherence', 'lexicalResource', 'grammaticalRangeAccuracy', 'pronunciation'] as const) {
      if (parsed.criteria[key]) {
        parsed.criteria[key].estimatedBand = roundBand(parsed.criteria[key].estimatedBand);
      }
    }

    const answerStats = answers.map((answer) => ({
      words: countIeltsWords(answer.transcript),
      durationSeconds: answer.durationSeconds,
      hasSpeech: answer.transcript.trim().length > 0,
    }));
    const spokenStats = answerStats.filter((stat) => stat.hasSpeech);
    const averageWords = spokenStats.length > 0
      ? spokenStats.reduce((sum, stat) => sum + stat.words, 0) / spokenStats.length
      : 0;
    const veryShortCount = answerStats.filter((stat) => !stat.hasSpeech || stat.words < 8 || stat.durationSeconds < 5).length;
    const thinCount = answerStats.filter((stat) => !stat.hasSpeech || stat.words < 15 || stat.durationSeconds < 8).length;
    const veryShortRatio = answerStats.length > 0 ? veryShortCount / answerStats.length : 1;
    const thinRatio = answerStats.length > 0 ? thinCount / answerStats.length : 1;
    const overallCap = (() => {
      if (veryShortRatio >= 0.4 || averageWords < 12) return 5;
      if (thinRatio >= 0.4) return 5.5;
      if (averageWords < 20) return 6;
      if (averageWords < 30) return 6.5;
      return 9;
    })();
    const examinerPenalty = averageWords < 30 || thinRatio >= 0.25 ? 0.5 : 0;

    for (const key of ['fluencyCoherence', 'lexicalResource', 'grammaticalRangeAccuracy', 'pronunciation'] as const) {
      const band = parsed.criteria[key]?.estimatedBand;
      if (band != null) {
        parsed.criteria[key].estimatedBand = clampIeltsBand(band - examinerPenalty, overallCap);
      }
    }

    // Re-compute estimatedBand from criteria (authoritative formula) if all criteria present
    const bands = [
      parsed.criteria.fluencyCoherence?.estimatedBand,
      parsed.criteria.lexicalResource?.estimatedBand,
      parsed.criteria.grammaticalRangeAccuracy?.estimatedBand,
      parsed.criteria.pronunciation?.estimatedBand,
    ];
    if (bands.every((b): b is number => b != null)) {
      parsed.estimatedBand = roundToNearestHalf(
        (bands[0] + bands[1] + bands[2] + bands[3]) / 4,
      );
    } else {
      parsed.estimatedBand = null;
    }

    // Guarantee disclaimer is always present
    parsed.disclaimer =
      'This is an AI-generated estimate for practice purposes. It is not an official IELTS score.';

    // Attach original answer fields (AI may echo stale values)
    parsed.questionResults = (parsed.questionResults ?? []).map((qr, i) => ({
      ...qr,
      questionId: answers[i]?.questionId ?? qr.questionId,
      topicName: answers[i]?.topicName ?? qr.topicName,
      transcript: answers[i]?.transcript ?? qr.transcript,
      durationSeconds: answers[i]?.durationSeconds ?? qr.durationSeconds,
      detectedIssues: qr.detectedIssues ?? [],
      pronunciationWords: qr.pronunciationWords ?? [],
      quickScore: (() => {
        const stat = answerStats[i];
        if (!stat?.hasSpeech) return null;
        const cap = stat.words < 8 || stat.durationSeconds < 5
          ? 4.5
          : stat.words < 15 || stat.durationSeconds < 8
            ? 5.5
            : stat.words < 25
              ? 6.5
              : 9;
        return qr.quickScore == null ? null : clampIeltsBand(qr.quickScore - examinerPenalty, cap);
      })(),
    }));

    parsed.durationSeconds = durationSeconds;
    parsed.topicCount = topicNames.length;
    parsed.questionCount = answers.length;
    parsed.coachingInsights = parsed.coachingInsights ?? [];
    if (examinerPenalty > 0 || overallCap < 9) {
      parsed.coachingInsights.push({
        key: 'examiner_calibration',
        label: 'Examiner calibration',
        value: `Average ${Math.round(averageWords)} words/answer`,
        message: 'Short or thin Part 1 answers are capped conservatively to avoid overestimating the practice band.',
      });
    }

    return parsed;
  } catch (e) {
    console.error('Failed to parse IELTS P1 session result:', e);
    throw new Error('Invalid response from AI.', { cause: e });
  }
};

export class UnifiedChatSession {
  private settings: AppSettings;
  private systemInstruction: string;
  private history: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  private geminiChat: GeminiChatSession | null = null;
  // Plain-text turn log used only by the Installed AI runtime, which is
  // stateless per call — we replay the conversation as one prompt each time.
  private installedTurns: { role: 'You' | 'Assistant'; text: string }[] = [];

  constructor(settings: AppSettings, systemInstruction: string) {
    this.settings = settings;
    this.systemInstruction = systemInstruction;

    if (settings.aiRuntimeType === 'installed') {
      if (!settings.selectedInstalledToolId) throw new Error('No installed AI tool is selected.');
      return;
    }

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
    if (this.settings.aiRuntimeType === 'installed') {
      this.installedTurns.push({ role: 'You', text });
      const conversation = this.installedTurns.map((t) => `${t.role}: ${t.text}`).join('\n\n');
      const prompt = `${this.systemInstruction}\n\n${conversation}\n\nAssistant:`;
      const reply = (await runInstalledAiPrompt(this.settings.selectedInstalledToolId, prompt)).trim();
      this.installedTurns.push({ role: 'Assistant', text: reply });
      return reply;
    }

    if (this.settings.aiProvider === 'gemini') {
      if (!this.geminiChat) throw new Error("Gemini chat session is not initialized");
      const result = await this.geminiChat.sendMessage(text);
      return result.response.text();
    } else {
      const openai = getOpenAIClient(this.settings);

      this.history.push({ role: 'user', content: text });

      const response = await openai.chat.completions.create({
        model: resolveOpenAIModel(this.settings),
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
