import pdfParse from "pdf-parse";
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { appendDocumentChunks, chunkText } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const sessionId = String(formData.get("sessionId") || "default");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 },
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 20MB." },
        { status: 400 },
      );
    }

    const data = await pdfParse(Buffer.from(await file.arrayBuffer()));
    const text = data.text || "";

    if (!text.trim()) {
      return NextResponse.json(
        {
          error: "Could not extract text from this PDF. It may be image-only.",
        },
        { status: 400 },
      );
    }

    const chunks = chunkText(text);
    appendDocumentChunks(sessionId, chunks);

    return NextResponse.json({
      message: "PDF processed successfully.",
      filename: file.name,
      totalChunks: chunks.length,
      previewText: text.slice(0, 300) + (text.length > 300 ? "..." : ""),
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: "Failed to process the PDF." },
      { status: 500 },
    );
  }
}
