"use client";

import { useRef, useState } from "react";
import { Button, Card, Pill } from "@/components/ui";
import type { ChatMessage } from "@/types/ai";

export function AiAssistantClient() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const sessionIdRef = useRef(sessionId);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("sessionId", sessionIdRef.current);

      const response = await fetch("/api/ai/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setStatus(data.message || "PDF processed successfully.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function send() {
    if (!message.trim()) return;

    const nextHistory = [...history, { role: "user" as const, text: message }];
    setHistory(nextHistory);
    setSending(true);
    setError(null);
    const currentMessage = message;
    setMessage("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: currentMessage,
          history: nextHistory,
        }),
      });

      if (!response.ok || !response.body) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "AI request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      setHistory((current) => [...current, { role: "ai", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setHistory((current) => {
          const copy = [...current];
          copy[copy.length - 1] = { role: "ai", text: answer };
          return copy;
        });
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "AI request failed.");
    } finally {
      setSending(false);
    }
  }

  async function clearReference() {
    setError(null);
    setStatus(null);

    const response = await fetch("/api/ai/clear", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionIdRef.current }),
    });

    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      setError(data.error || "Failed to clear reference.");
      return;
    }

    setHistory([]);
    setStatus(data.message || "Document context cleared.");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="p-5">
        <Pill>Reference-only AI</Pill>
        <h1 className="mt-4 text-2xl font-bold text-white">Upload study notes</h1>
        <p className="mt-2 text-sm text-white/56">
          PDF only. Answers stay grounded in your uploaded reference, with the exact fallback sentence preserved.
        </p>
        <label className="mt-6 block rounded-[26px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-center">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void upload(file);
              }
            }}
          />
          <span className="text-sm font-medium text-white">{uploading ? "Uploading..." : "Choose PDF reference"}</span>
          <span className="mt-2 block text-xs text-white/42">Maximum 20MB</span>
        </label>
        <div className="mt-4">
          <Button onClick={clearReference}>Clear Reference</Button>
        </div>
        {status ? <p className="mt-4 text-sm text-emerald-300">{status}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      </Card>
      <Card className="flex min-h-[76vh] flex-col p-5">
        <div className="border-b border-white/8 pb-4">
          <h2 className="text-xl font-semibold text-white">Gradee AI Co-pilot</h2>
          <p className="mt-1 text-sm text-white/50">Grounded Q&A with streamed answers.</p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto py-5">
          {history.length === 0 ? (
            <div className="grid min-h-[300px] place-items-center text-center text-white/44">
              Upload a PDF and ask questions about the material.
            </div>
          ) : (
            history.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`max-w-[85%] rounded-[24px] px-4 py-3 text-sm leading-7 ${
                  item.role === "user"
                    ? "ml-auto bg-white text-slate-950"
                    : "bg-white/6 text-white"
                }`}
              >
                {item.text}
              </div>
            ))
          )}
        </div>
        <div className="flex gap-3 border-t border-white/8 pt-4">
          <textarea
            className="field min-h-24 flex-1 resize-none"
            placeholder="Ask about your uploaded reference..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <Button
            className="self-end bg-white text-slate-950 hover:bg-white/90"
            disabled={sending}
            onClick={send}
          >
            {sending ? "Streaming..." : "Send"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
