import type { AppSettings } from "../../../components/settings-context";
import { UnifiedChatSession } from "../../../services/ai";
import type {
  ConversationTurn,
  ConversationTurnResponse,
  ConversationLevel,
  SendConversationTurnPayload,
} from "../types/virtualConversation.types";

/**
 * Per-conversation AI chat sessions keyed by conversationId.
 * Kept module-level so the same multi-turn session persists across turns.
 */
const chatSessions = new Map<string, UnifiedChatSession>();

function buildSystemPrompt(level: ConversationLevel): string {
  const levelGuide =
    level === "beginner"
      ? "Use simple vocabulary and short sentences."
      : level === "intermediate"
      ? "Use natural vocabulary at B1–B2 level."
      : "Use rich vocabulary and complex structures at C1 level.";

  return `You are a friendly, encouraging English conversation teacher.
Continue the conversation naturally. ${levelGuide}
- Gently correct grammar/vocabulary errors without interrupting the flow.
- Keep your replies concise (2-4 sentences).
- Always end with one follow-up question to keep the learner talking.
- If the learner made mistakes, provide a corrected version after your reply.
Respond ONLY as a JSON object with this exact shape:
{
  "aiReply": "string",
  "correctedText": "string or null (corrected version of what the user said, null if correct)",
  "feedback": {
    "grammar": "string or null",
    "vocabulary": "string or null",
    "fluency": "string or null",
    "suggestion": "string or null"
  }
}`;
}

function buildHistory(turns: ConversationTurn[]): string {
  if (turns.length === 0) return "";
  return (
    "\n\nConversation so far:\n" +
    turns
      .map((t) => `${t.role === "user" ? "Learner" : "Teacher"}: ${t.text}`)
      .join("\n")
  );
}

/** Client-side implementation: calls AI provider directly (no separate backend needed). */
export async function sendConversationTurn(
  settings: AppSettings,
  payload: SendConversationTurnPayload
): Promise<ConversationTurnResponse> {
  const {
    conversationId,
    turnIndex,
    transcript,
    conversationHistory,
    level,
    abortSignal,
  } = payload;

  if (abortSignal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  // Reuse or create chat session for this conversation.
  if (!chatSessions.has(conversationId)) {
    chatSessions.set(
      conversationId,
      new UnifiedChatSession(settings, buildSystemPrompt(level))
    );
  }
  const session = chatSessions.get(conversationId)!;

  const userMessage =
    `Learner said: "${transcript}"` + buildHistory(conversationHistory);

  // Wrap sendMessage in an AbortSignal-aware Promise.
  const responseText = await new Promise<string>((resolve, reject) => {
    if (abortSignal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
    abortSignal?.addEventListener("abort", onAbort, { once: true });

    session
      .sendMessage(userMessage)
      .then((text) => {
        abortSignal?.removeEventListener("abort", onAbort);
        resolve(text);
      })
      .catch((err) => {
        abortSignal?.removeEventListener("abort", onAbort);
        reject(err);
      });
  });

  try {
    // Strip markdown code fences the model sometimes wraps around JSON.
    const cleaned = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      turnId: `turn-${conversationId}-${turnIndex}`,
      transcript,
      correctedText: parsed.correctedText ?? undefined,
      aiReply: parsed.aiReply ?? "",
      feedback: parsed.feedback ?? undefined,
    };
  } catch {
    // Fallback: treat raw text as aiReply.
    return {
      turnId: `turn-${conversationId}-${turnIndex}`,
      transcript,
      aiReply: responseText,
    };
  }
}

/** Call when leaving the conversation screen to free memory. */
export function clearConversationSession(conversationId: string): void {
  chatSessions.delete(conversationId);
}
