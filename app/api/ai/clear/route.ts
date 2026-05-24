import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { clearDocumentChunks } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json();
  const sessionId = String(body.sessionId || "default");
  clearDocumentChunks(sessionId);
  return NextResponse.json({ message: "Document context cleared." });
}
