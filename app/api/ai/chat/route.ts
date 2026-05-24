import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_OPENAI_MODEL,
  REFERENCE_FALLBACK,
  buildMessages,
  getDocumentChunks,
  getOpenAIClient,
  retrieveChunks,
  type ChatHistoryItem,
} from "@/lib/openai";
import { requireApiUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const message = String(body.message || "");
    const sessionId = String(body.sessionId || "default");
    const history = (Array.isArray(body.history) ? body.history : []) as ChatHistoryItem[];

    if (!message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "YOUR_OPENAI_API_KEY_HERE"
    ) {
      return NextResponse.json(
        {
          error: "OpenAI API key is not configured. Please add your key to .env",
        },
        { status: 500 },
      );
    }

    const chunks = getDocumentChunks(sessionId);
    const hasReference = Boolean(chunks && chunks.length > 0);

    if (!hasReference || !chunks) {
      return NextResponse.json(
        {
          error:
            "Please upload a reference document first. This assistant is currently restricted to answering only from user-provided references.",
        },
        { status: 400 },
      );
    }

    let contextBlock = "";
    const relevant = retrieveChunks(message, chunks, 5);

    if (relevant.length > 0) {
      contextBlock = `\n\n--- UPLOADED DOCUMENT CONTEXT ---\n${relevant.join("\n\n---\n\n")}\n--- END CONTEXT ---\n`;
    }

    const userPrompt = contextBlock
      ? `Answer the question using only the uploaded reference below.

Question:
${message}

Reference:
${contextBlock}

If the reference does not contain the answer, reply exactly with:
"${REFERENCE_FALLBACK}"`
      : `Answer the question using only the uploaded reference.

Question:
${message}

No relevant reference passage was retrieved for this question.
If the reference does not contain the answer, reply exactly with:
"${REFERENCE_FALLBACK}"`;

    const client = getOpenAIClient();
    const messages = buildMessages(history, userPrompt, { groundedMode: true });

    const stream = await client.chat.completions.create({
      model: DEFAULT_OPENAI_MODEL,
      messages,
      stream: true,
    });

    const encoder = new TextEncoder();

    return new NextResponse(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices?.[0]?.delta?.content;
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          } catch (error) {
            console.error("AI stream error:", error);
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error: unknown) {
    console.error("AI chat error:", error);

    const maybeError = error as { status?: number };
    if (maybeError.status === 401) {
      return NextResponse.json(
        {
          error: "OpenAI authentication failed. Please verify your OPENAI_API_KEY.",
        },
        { status: 500 },
      );
    }

    if (maybeError.status === 429) {
      return NextResponse.json(
        {
          error: "OpenAI rate limit reached. Please try again in a moment.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json({ error: "AI generation failed." }, { status: 500 });
  }
}
