"use client";

import { useState, useEffect } from "react";

type SendStatus = "success" | "error";

type HistoryItem = {
  id: string;
  timestamp: string;
  url: string;
  status: SendStatus;
  author: string;
  detail: string;
};

const HISTORY_STORAGE_KEY = "xToKindleHistory";
const HISTORY_LIMIT = 300;

export default function Home() {
  const [kindleEmail, setKindleEmail] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("kindleEmail");
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);

    if (savedEmail) {
      setKindleEmail(savedEmail);
    } else {
      setIsSettingsOpen(true);
    }

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as HistoryItem[];
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } catch (error) {
        console.error("Failed to parse saved history", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleSaveEmail = () => {
    localStorage.setItem("kindleEmail", kindleEmail);
    setIsSettingsOpen(false);
  };

  const normalizeUrlForDedup = (value: string): string => {
    try {
      const parsed = new URL(value.trim());
      parsed.hash = "";
      parsed.searchParams.sort();
      return parsed.toString();
    } catch {
      return value.trim().toLowerCase();
    }
  };

  const parseUrls = (rawInput: string): string[] =>
    rawInput
      .split(/[\n,\s]+/)
      .map((url) => url.trim())
      .filter(Boolean);

  const dedupeUrls = (urls: string[]) => {
    const seen = new Set<string>();
    const unique: string[] = [];
    let duplicates = 0;

    for (const url of urls) {
      const normalized = normalizeUrlForDedup(url);
      if (seen.has(normalized)) {
        duplicates += 1;
        continue;
      }

      seen.add(normalized);
      unique.push(url);
    }

    return { unique, duplicates };
  };

  const exportHistory = (format: "json" | "csv") => {
    if (!history.length) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `x-to-kindle-history-${timestamp}.${format}`;

    let content = "";
    let mimeType = "";

    if (format === "json") {
      content = JSON.stringify(history, null, 2);
      mimeType = "application/json";
    } else {
      const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const rows = [
        ["timestamp", "status", "url", "author", "detail"],
        ...history.map((item) => [item.timestamp, item.status, item.url, item.author, item.detail]),
      ];
      content = rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n");
      mimeType = "text/csv;charset=utf-8";
    }

    const blob = new Blob([content], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const clearHistory = () => {
    if (!history.length) return;

    const shouldClear = window.confirm("Clear sent history? This will allow previously sent links to be sent again.");
    if (!shouldClear) return;

    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    setStatus("success");
    setMessage("HISTORY CLEARED. PREVIOUS LINKS CAN NOW BE RESENT.");
  };

  const rawParsedUrls = parseUrls(inputValue);
  const previewDedup = dedupeUrls(rawParsedUrls);
  const sentUrlSet = new Set(
    history
      .filter((item) => item.status === "success")
      .map((item) => normalizeUrlForDedup(item.url))
  );
  const previewAlreadySent = previewDedup.unique.filter((url) => sentUrlSet.has(normalizeUrlForDedup(url))).length;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kindleEmail) {
      setIsSettingsOpen(true);
      return;
    }

    const rawUrls = isMultiMode ? parseUrls(inputValue) : [inputValue.trim()];
    const { unique: urls, duplicates } = dedupeUrls(rawUrls);
    const urlsToProcess = urls.filter((url) => !sentUrlSet.has(normalizeUrlForDedup(url)));
    const alreadySentCount = urls.length - urlsToProcess.length;
    const notes: string[] = [];
    if (duplicates > 0) {
      notes.push(`${duplicates} DUPLICATE${duplicates > 1 ? "S" : ""} SKIPPED`);
    }
    if (alreadySentCount > 0) {
      notes.push(`${alreadySentCount} ALREADY SENT SKIPPED`);
    }
    const statusNote = notes.length ? ` (${notes.join(", ")})` : "";

    if (!urls.length) {
      setStatus("error");
      setMessage("ERROR: Please provide at least one X/Twitter URL.");
      return;
    }

    if (!urlsToProcess.length) {
      setStatus("success");
      setMessage(`SKIPPED: ALL LINKS WERE ALREADY SENT.${statusNote} CLEAR HISTORY TO RESEND.`);
      return;
    }

    setStatus("loading");
    setMessage(
      isMultiMode
        ? `FETCHING ${urlsToProcess.length} ARTICLES [___]${statusNote}`
        : `FETCHING ARTICLE [___]${statusNote}`
    );

    try {
      const successes: string[] = [];
      const failures: string[] = [];
      const historyEntries: HistoryItem[] = [];

      for (const url of urlsToProcess) {
        const res = await fetch("/api/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, kindleEmail }),
        });

        const data = await res.json();

        if (!res.ok) {
          failures.push(`${url} (${data.error || "Failed to process the article."})`);
          historyEntries.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: new Date().toISOString(),
            url,
            status: "error",
            author: "N/A",
            detail: data.error || "Failed to process the article.",
          });
          continue;
        }

        const author = data.author || "Unknown Author";
        const articleTitle = data.title || author || "Untitled Article";
        successes.push(articleTitle);
        historyEntries.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: new Date().toISOString(),
          url,
          status: "success",
          author,
          detail: articleTitle,
        });
      }

      if (historyEntries.length > 0) {
        setHistory((prev) => [...historyEntries.reverse(), ...prev].slice(0, HISTORY_LIMIT));
      }

      if (!failures.length) {
        setStatus("success");
        setMessage(
          isMultiMode
            ? `FETCHED ${successes.length}/${urlsToProcess.length} ARTICLES SUCCESSFULLY.${statusNote}`
            : `FETCHED: ${successes[0]}`
        );
        return;
      }

      if (!successes.length) {
        setStatus("error");
        setMessage(`ERROR: Failed to process ${failures.length} URL(s).${statusNote}`);
        return;
      }

      setStatus("error");
      setMessage(`PARTIAL: ${successes.length} SENT, ${failures.length} FAILED.${statusNote}`);

    } catch (err: unknown) {
      console.error(err);
      setStatus("error");
      if (err instanceof Error) {
        setMessage(`ERROR: ${err.message}`);
      } else {
        setMessage("ERROR: An unknown error occurred.");
      }
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-xl space-y-12">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl sm:text-5xl tracking-widest uppercase animate-pixel-build">X_TO_KINDLE</h1>
          <p className="text-neutral-400 text-base sm:text-lg tracking-wider animate-pixel-build animate-pixel-build-delay">
            X / TWITTER ARTICLES TO KINDLE
          </p>
        </header>

        {isSettingsOpen ? (
          <section className="border border-neutral-800 p-6 space-y-6 bg-[#050505]">
            <h2 className="text-2xl uppercase tracking-wider">Settings</h2>

            <div className="space-y-4">
              <label className="block text-base text-neutral-300">@KINDLE APP EMAIL</label>
              <input
                type="email"
                value={kindleEmail}
                onChange={(e) => setKindleEmail(e.target.value)}
                placeholder="username@kindle.com"
                className="w-full bg-transparent border-b border-neutral-700 py-2 text-xl focus:outline-none focus:border-white transition-colors"
                autoFocus
              />
            </div>

            <div className="text-sm text-neutral-400 space-y-2 leading-relaxed">
              <p>
                • Open{" "}
                <a
                  href="https://www.amazon.com/hz/mycd/preferences/myx#/home/settings/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-200 underline underline-offset-2 hover:text-white transition-colors"
                >
                  Amazon Content & Devices Settings
                </a>
                .
              </p>
              <p>• On that page, you can find your Kindle email address or create a new one.</p>
              <p>• Add <span className="text-white">kindle@yegorgolovnia.com</span> to the Approved Personal Document E-mail List.</p>
            </div>

            <button
              onClick={handleSaveEmail}
              disabled={!kindleEmail.includes("@kindle.com")}
              className="w-full py-3 bg-white text-black text-base uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SAVE CONFIG
            </button>
          </section>
        ) : (
          <form onSubmit={handleSend} className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <label className="block text-base text-neutral-300 uppercase tracking-widest">
                  {isMultiMode ? "X / TWITTER URLS" : "X / TWITTER URL"}
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-neutral-400 uppercase tracking-widest">
                    <input
                      type="checkbox"
                      checked={isMultiMode}
                      onChange={(e) => setIsMultiMode(e.target.checked)}
                      className="h-3 w-3 accent-white"
                    />
                    MULTI
                  </label>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      className="text-sm text-neutral-500 hover:text-white transition-colors uppercase tracking-widest"
                    >
                      [CONFIG]
                    </button>
                </div>
              </div>
              {isMultiMode ? (
                <div className="space-y-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Paste multiple links (comma, space, or new line separated)"
                    className="w-full bg-transparent border border-neutral-700 py-3 px-3 text-base focus:outline-none focus:border-white transition-colors placeholder:text-neutral-600 min-h-32 resize-y"
                    required
                  />
                  <p className="text-sm text-neutral-400 uppercase tracking-widest">
                    {previewDedup.unique.length} LINKS DETECTED
                    {previewDedup.duplicates > 0
                      ? ` (${previewDedup.duplicates} DUPLICATE${previewDedup.duplicates > 1 ? "S" : ""} WILL BE SKIPPED)`
                      : ""}
                    {previewAlreadySent > 0
                      ? ` (${previewAlreadySent} ALREADY SENT${previewAlreadySent > 1 ? " LINKS" : " LINK"} WILL BE SKIPPED)`
                      : ""}
                  </p>
                </div>
              ) : (
                <input
                  type="url"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="https://x.com/username/status/..."
                  className="w-full bg-transparent border-b border-neutral-700 py-3 text-xl focus:outline-none focus:border-white transition-colors placeholder:text-neutral-700"
                  required
                />
              )}
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !inputValue.trim()}
              className="w-full py-4 bg-white text-black text-base uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              {status === "loading" ? "PROCESSING..." : "SEND TO KINDLE"}
            </button>

            {message && (
              <div className={`p-4 border text-center text-base uppercase tracking-widest ${status === "error" ? "border-red-900 text-red-500" :
                status === "success" ? "border-green-900 text-green-500" :
                  "border-neutral-800 text-neutral-400"
                }`}>
                {message}
              </div>
            )}

            <section className="border border-neutral-800 p-4 bg-[#050505] space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base uppercase tracking-widest text-neutral-200">
                  Send History ({history.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportHistory("json")}
                    disabled={!history.length}
                    className="px-2 py-1 border border-neutral-700 text-xs uppercase tracking-widest text-neutral-400 hover:text-white hover:border-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => exportHistory("csv")}
                    disabled={!history.length}
                    className="px-2 py-1 border border-neutral-700 text-xs uppercase tracking-widest text-neutral-400 hover:text-white hover:border-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={clearHistory}
                    disabled={!history.length}
                    className="px-2 py-1 border border-red-900 text-xs uppercase tracking-widest text-red-500 hover:text-red-300 hover:border-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Clear History
                  </button>
                </div>
              </div>

              {!history.length ? (
                <p className="text-sm text-neutral-500 uppercase tracking-widest">No articles sent yet.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="border border-neutral-900 p-2 text-sm space-y-1"
                    >
                      <p className={`uppercase tracking-widest ${item.status === "success" ? "text-green-500" : "text-red-500"}`}>
                        {item.status}
                      </p>
                      <p className="text-neutral-300 break-all">{item.url}</p>
                      <p className="text-neutral-500">{item.author}</p>
                      <p className="text-neutral-600">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </form>
        )}

        <footer className="border-t border-neutral-900 pt-4 text-sm uppercase tracking-widest text-neutral-500 space-y-2">
          <p>
            built by:{" "}
            <a
              href="https://yegorgolovnia.com"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              yegorgolovnia.com
            </a>
          </p>
          <p>
            my x:{" "}
            <a
              href="https://x.com/yegorgolovnia"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              x.com/yegorgolovnia
            </a>
          </p>
          <p>
            github:{" "}
            <a
              href="https://github.com/yegorgolovnia"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              github.com/yegorgolovnia
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
