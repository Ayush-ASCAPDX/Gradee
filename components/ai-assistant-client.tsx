"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@/types/auth";
import type { ChatMessage } from "@/types/ai";

type SpeechRecognitionResultLike = {
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type StoredHistoryItem =
  | { type: "file"; name: string }
  | { type: "text"; role: ChatMessage["role"]; text: string };

const SUGGESTIONS = [
  {
    icon: "lightbulb",
    title: "Explain Concepts",
    description: '"Explain Quantum Entanglement like I\'m 15..."',
    color: "text-plum",
    prompt: "Explain Quantum Entanglement simply",
  },
  {
    icon: "event_repeat",
    title: "Plan Study Path",
    description: '"Create a 4-week prep plan for my Finals..."',
    color: "text-grape",
    prompt: "Create a 4-week study plan for Calculus",
  },
  {
    icon: "auto_awesome",
    title: "Summarize Notes",
    description: '"Analyze and summarize these lecture notes..."',
    color: "text-deep",
    prompt: "Summarize the main themes of Macbeth",
  },
  {
    icon: "quiz",
    title: "Test Mastery",
    description: '"Generate 10 practice MCQs for Bio-Chemistry..."',
    color: "bg-ink text-mint rounded-lg",
    prompt: "Generate 10 practice questions for Bio-Chem",
  },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatMarkdown(md: string) {
  return escapeHtml(md)
    .replace(/```([\s\S]*?)```/g, '<pre class="my-3 overflow-x-auto rounded-xl bg-ink/5 p-3 text-xs"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-ink/5 px-1.5 py-0.5 text-xs">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="mb-1 mt-3 text-base font-bold">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mb-1 mt-4 text-lg font-bold">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="mb-2 mt-4 text-xl font-bold">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n/g, "<br>");
}

export function AiAssistantClient({ user }: { user: User }) {
  const [chatHistory, setChatHistory] = useState<StoredHistoryItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const stored = window.localStorage.getItem("gradeeChatHistory");
      return stored ? (JSON.parse(stored) as StoredHistoryItem[]) : [];
    } catch {
      return [];
    }
  });
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const stored = window.localStorage.getItem("gradeeChatHistory");
      const parsed = stored ? (JSON.parse(stored) as StoredHistoryItem[]) : [];
      return parsed.flatMap((item) =>
        item.type === "text" ? [{ role: item.role, text: item.text }] : [],
      );
    } catch {
      return [];
    }
  });
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") {
      return "server-session";
    }

    const existing = window.localStorage.getItem("gradeeSessionId");
    if (existing) {
      return existing;
    }

    const created = crypto.randomUUID();
    window.localStorage.setItem("gradeeSessionId", created);
    return created;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    window.localStorage.setItem("gradeeChatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatHistory, streamingText, isGenerating]);

  useEffect(() => {
    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : undefined;

    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setMessage(transcript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const hasMessages = chatHistory.length > 0 || isGenerating;

  const displayedMessages = useMemo(() => {
    const items = [...chatHistory];
    if (isGenerating && streamingText) {
      items.push({ type: "text", role: "ai", text: streamingText } satisfies StoredHistoryItem);
    }
    return items;
  }, [chatHistory, isGenerating, streamingText]);

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function stopGeneration() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
    setStreamingText("");
  }

  async function handleSend(rawText: string) {
    const trimmed = rawText.trim();
    if (!trimmed && !file) return;

    let query = trimmed;
    const nextHistoryItems: StoredHistoryItem[] = [];

    if (file) {
      nextHistoryItems.push({ type: "file", name: file.name });
      if (!query) {
        query = "Please summarize this PDF document for me.";
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);

      const uploadResponse = await fetch("/api/ai/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        const errorData = (await uploadResponse.json().catch(() => ({}))) as { error?: string };
        nextHistoryItems.push({
          type: "text",
          role: "ai",
          text: `⚠️ Failed to process PDF: ${errorData.error || "Upload failed."}`,
        });
        setChatHistory((current) => [...current, ...nextHistoryItems]);
        clearFile();
        return;
      }
    }

    nextHistoryItems.push({ type: "text", role: "user", text: query });
    const nextConversation = [...conversationHistory, { role: "user" as const, text: query }];

    setChatHistory((current) => [...current, ...nextHistoryItems]);
    setConversationHistory(nextConversation);
    setMessage("");
    clearFile();
    setIsGenerating(true);
    setStreamingText("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          sessionId,
          history: nextConversation,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingText(fullText);
      }

      setConversationHistory((current) => [...current, { role: "ai", text: fullText }]);
      setChatHistory((current) => [...current, { type: "text", role: "ai", text: fullText }]);
      setStreamingText("");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        const text = error instanceof Error ? error.message : "Something went wrong.";
        setChatHistory((current) => [...current, { type: "text", role: "ai", text: `⚠️ ${text}` }]);
      }
      setStreamingText("");
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }

  return (
    <section className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/20 bg-white/10 px-2 py-4 backdrop-blur-md sm:px-3 lg:px-8 lg:py-5">
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white sm:h-10 sm:w-10">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <h1 className="truncate font-serif text-xl font-bold text-ink sm:text-2xl">AI Co-pilot</h1>
        </div>
        <div className="profile-chip flex items-center gap-3 rounded-full border border-white/40 bg-white/40 px-3 py-1.5 text-sm font-semibold shadow-soft transition hover:bg-white/60 lg:px-4 lg:py-2">
          <span>{user.name || "Scholar"}</span>
        </div>
      </header>

      <div className="relative flex-1 overflow-y-auto px-3 py-6 lg:p-10">
        {!hasMessages ? (
          <div className="mx-auto mt-6 max-w-4xl space-y-8 lg:mt-12 lg:space-y-12">
            <div className="space-y-3 text-center lg:space-y-4">
              <h2 className="font-serif text-[clamp(1.55rem,8vw,3.5rem)] font-bold leading-tight text-ink lg:text-5xl">
                How can I help you <br />
                <span className="italic text-plum">excel today?</span>
              </h2>
              <p className="mx-auto max-w-lg text-ink/60">
                Your personal academic research engine, summarizer, and study planner.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item.title}
                  onClick={() => void handleSend(item.prompt)}
                  className="panel rounded-[1.8rem] p-4 text-left transition hover:-translate-y-1 lg:p-6"
                >
                  <span className={`material-symbols-outlined mb-3 ${item.color}`}>{item.icon}</span>
                  <h3 className="font-bold text-ink">{item.title}</h3>
                  <p className="mt-1 text-xs text-ink/60">{item.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-8 pb-8 lg:pb-32">
            {displayedMessages.map((entry, index) => {
              if (entry.type === "file") {
                return (
                  <div key={`file-${index}`} className="flex justify-end">
                    <div className="flex max-w-[85%] flex-row-reverse gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-plum text-white">
                        <span className="material-symbols-outlined text-sm">person</span>
                      </div>
                      <div className="panel glass flex items-center gap-3 rounded-[1.5rem] border border-plum/20 px-5 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum/10 text-plum">
                          <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        </div>
                        <div>
                          <p className="max-w-[150px] truncate text-xs font-bold text-ink">{entry.name}</p>
                          <p className="text-[9px] uppercase tracking-widest text-ink/40">Document Uploaded</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const isAi = entry.role === "ai";
              return (
                <div key={`${entry.role}-${index}`} className={`group/msg flex ${isAi ? "justify-start" : "justify-end"}`}>
                  <div className={`flex max-w-[85%] gap-4 ${isAi ? "flex-row" : "flex-row-reverse"}`}>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isAi ? "bg-ink text-white" : "bg-plum text-white"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{isAi ? "smart_toy" : "person"}</span>
                    </div>
                    <div
                      className={`relative rounded-[1.5rem] px-6 py-4 ${
                        isAi ? "panel text-ink" : "bg-deep text-white shadow-float"
                      }`}
                    >
                      {isAi ? (
                        <div
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatMarkdown(entry.text) }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.text}</p>
                      )}
                      {isAi ? (
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard.writeText(entry.text)}
                          className="copy-btn absolute top-2 right-2 rounded-lg p-1.5 opacity-0 transition-opacity hover:bg-plum hover:text-white group-hover/msg:opacity-100"
                          title="Copy to clipboard"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {isGenerating && !streamingText ? (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                  </div>
                  <div className="panel glass flex items-center gap-1.5 rounded-[1.5rem] px-6 py-4">
                    <div className="thinking-dot rounded-full bg-plum" style={{ animationDelay: "-0.32s" }} />
                    <div className="thinking-dot rounded-full bg-plum" style={{ animationDelay: "-0.16s" }} />
                    <div className="thinking-dot rounded-full bg-plum" />
                  </div>
                </div>
              </div>
            ) : null}
            <div ref={chatScrollRef} />
          </div>
        )}
      </div>

      <div className="px-2 pb-6 pt-4 sm:px-3 sm:pb-8 lg:p-10">
        <div className="relative mx-auto max-w-4xl">
          {file ? (
            <div className="glass absolute bottom-full left-1 right-1 mb-4 flex items-center gap-2 rounded-2xl p-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-plum text-white">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              </div>
              <div className="min-w-0 flex-1 pr-4">
                <p className="truncate text-xs font-bold text-ink">{file.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-ink/40">Ready to summarize</p>
              </div>
              <button type="button" onClick={clearFile} className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-ink/5">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend(message);
            }}
            className="panel flex items-center gap-0.5 rounded-[2.5rem] p-1 sm:gap-3 sm:p-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full p-2 text-ink/40 hover:bg-ink/5 sm:p-4">
              <span className="material-symbols-outlined">attachment</span>
            </button>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask your co-pilot..."
              className="min-w-0 flex-1 border-none bg-transparent px-1 py-3 text-sm font-medium focus:ring-0 sm:py-4 sm:text-base"
            />
            {speechSupported ? (
              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    recognitionRef.current?.stop();
                  } else {
                    recognitionRef.current?.start();
                  }
                }}
                className={`rounded-full p-2 text-ink/40 transition hover:bg-ink/5 sm:p-4 ${isListening ? "animate-pulse text-plum" : ""}`}
              >
                <span className="material-symbols-outlined">mic</span>
              </button>
            ) : null}
            {!isGenerating ? (
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum text-white shadow-soft transition hover:bg-deep active:scale-95 sm:h-14 sm:w-14"
              >
                <span className="material-symbols-outlined">north</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopGeneration}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-soft transition hover:bg-red-600 active:scale-95 sm:h-14 sm:w-14"
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl">stop</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
