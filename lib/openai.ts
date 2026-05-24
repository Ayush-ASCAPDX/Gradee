import OpenAI from "openai";

export type ChatHistoryItem = {
  role: "user" | "ai";
  text: string;
};

type DocumentStore = Map<string, string[]>;

declare global {
  var __gradeeDocumentStore__: DocumentStore | undefined;
}

const documentStore = global.__gradeeDocumentStore__ ?? new Map<string, string[]>();
global.__gradeeDocumentStore__ = documentStore;

let openai: OpenAI | null = null;

export const SYSTEM_PROMPT = `You are Gradee AI Co-pilot, a brilliant and friendly academic assistant built exclusively for students.

RULES:
- Always answer in clear, well-structured Markdown.
- Use bullet points, numbered lists, and headers to organise longer answers.
- When you reference information from an uploaded document, cite the source naturally (for example: "According to your uploaded notes...").
- If you do not know something, say so honestly rather than hallucinating.
- Keep your tone encouraging and academic, like a supportive tutor.
- When generating study plans, use tables or structured timelines.
- When generating practice questions, number them and provide answer keys at the end.`;

export const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
export const REFERENCE_FALLBACK = "I can't find that in the reference you provided.";

export function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openai;
}

export function getDocumentChunks(sessionId: string) {
  return documentStore.get(sessionId);
}

export function appendDocumentChunks(sessionId: string, chunks: string[]) {
  if (!documentStore.has(sessionId)) {
    documentStore.set(sessionId, []);
  }

  documentStore.get(sessionId)?.push(...chunks);
}

export function clearDocumentChunks(sessionId: string) {
  documentStore.delete(sessionId);
}

export function chunkText(text: string, size = 1000, overlap = 200) {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }

  return chunks;
}

export function retrieveChunks(query: string, chunks: string[], topK = 5) {
  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const scored = chunks.map((chunk, idx) => {
    const lower = chunk.toLowerCase();
    let score = 0;

    for (const word of queryWords) {
      const regex = new RegExp(word, "gi");
      const matches = lower.match(regex);
      if (matches) {
        score += matches.length;
      }
    }

    return { idx, chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((item) => item.chunk);
}

export function buildMessages(
  history: ChatHistoryItem[],
  userPrompt: string,
  options: { groundedMode?: boolean } = {},
) {
  const safeHistory = Array.isArray(history) ? history : [];
  const normalizedHistory = [...safeHistory];
  const lastMessage = normalizedHistory[normalizedHistory.length - 1];
  const groundedMode = Boolean(options.groundedMode);

  if (lastMessage?.role === "user" && lastMessage?.text?.trim() === userPrompt.trim()) {
    normalizedHistory.pop();
  }

  const systemPrompt = groundedMode
    ? `${SYSTEM_PROMPT}

REFERENCE-ONLY MODE:
- Answer using only the uploaded reference content provided in the conversation.
- Do not use outside knowledge, assumptions, or general facts not supported by the reference.
- If the reference does not contain the answer, say clearly: "${REFERENCE_FALLBACK}"
- If the question is only partially supported by the reference, answer only the supported part and say what is missing.
- Do not invent definitions, examples, or explanations beyond the reference.`
    : SYSTEM_PROMPT;

  return [
    { role: "system" as const, content: systemPrompt },
    ...normalizedHistory
      .filter((msg) => typeof msg?.text === "string" && msg.text.trim())
      .map((msg) => ({
        role: msg.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: msg.text,
      })),
    { role: "user" as const, content: userPrompt },
  ];
}
