import type { SpeakingMode, SpeakingTranscript } from "../types/speaking.types";

export interface TranscribeWhisperInput {
  audioBlob: Blob;
  language: "en" | "vi";
  mode: SpeakingMode;
  targetText?: string;
  signal?: AbortSignal;
}

export async function transcribeWithWhisper({
  audioBlob,
  language,
  mode,
  targetText,
  signal,
}: TranscribeWhisperInput): Promise<SpeakingTranscript> {
  const endpoint = import.meta.env.VITE_SPEECH_TRANSCRIBE_ENDPOINT || "/api/speech/transcribe";

  const formData = new FormData();
  formData.append("audioFile", audioBlob, "audio.webm");
  formData.append("language", language);
  formData.append("mode", mode);
  if (targetText) {
    formData.append("targetText", targetText);
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      signal,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Normalize response based on different potential backend formats
    let text = "";
    let segments = [];

    if (data.transcript && data.transcript.text) {
      text = data.transcript.text;
      segments = data.transcript.segments || [];
    } else if (data.recognizedText) {
      text = data.recognizedText;
      segments = data.segments || [];
    } else if (data.text) {
      text = data.text;
      segments = data.segments || [];
    } else {
      throw new Error("Invalid response format from Whisper API");
    }

    if (!text || text.trim() === "") {
      throw new Error("Không nhận diện được giọng nói. Vui lòng thử lại.");
    }

    return {
      text: text.trim(),
      isFinal: true,
      segments,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw error;
    }
    console.error("Transcribe API Error:", error);
    throw new Error(error.message || "Có lỗi khi xử lý giọng nói. Vui lòng thử lại.");
  }
}
