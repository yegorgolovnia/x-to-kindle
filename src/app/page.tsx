"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [kindleEmail, setKindleEmail] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("kindleEmail");
    if (savedEmail) {
      setKindleEmail(savedEmail);
    } else {
      setIsSettingsOpen(true);
    }
  }, []);

  const handleSaveEmail = () => {
    localStorage.setItem("kindleEmail", kindleEmail);
    setIsSettingsOpen(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kindleEmail) {
      setIsSettingsOpen(true);
      return;
    }

    setStatus("loading");
    setMessage("FETCHING ARTICLE [___]");

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: xUrl, kindleEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process the article.");
      }

      setStatus("success");
      setMessage(`FETCHED: ${data.author} - ${data.textPreview}`);

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
      <div className="w-full max-w-lg space-y-12">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl tracking-widest uppercase animate-pixel-build">X_TO_KINDLE</h1>
          <p className="text-neutral-500 text-sm tracking-wider animate-pixel-build">
            RAW TEXT DELIVERY SYSTEM
          </p>
        </header>

        {isSettingsOpen ? (
          <section className="border border-neutral-800 p-6 space-y-6 bg-[#050505]">
            <h2 className="text-xl uppercase tracking-wider">Settings</h2>

            <div className="space-y-4">
              <label className="block text-sm text-neutral-400">@KINDLE APP EMAIL</label>
              <input
                type="email"
                value={kindleEmail}
                onChange={(e) => setKindleEmail(e.target.value)}
                placeholder="username@kindle.com"
                className="w-full bg-transparent border-b border-neutral-700 py-2 focus:outline-none focus:border-white transition-colors"
                autoFocus
              />
            </div>

            <div className="text-xs text-neutral-500 space-y-2 leading-relaxed">
              <p>• Go to Amazon &gt; Manage Your Content & Devices &gt; Preferences</p>
              <p>• Add <span className="text-white">kindle@yegorgolovnia.com</span> to the Approved Personal Document E-mail List.</p>
            </div>

            <button
              onClick={handleSaveEmail}
              disabled={!kindleEmail.includes("@kindle.com")}
              className="w-full py-3 bg-white text-black uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SAVE CONFIG
            </button>
          </section>
        ) : (
          <form onSubmit={handleSend} className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <label className="block text-sm text-neutral-400 uppercase tracking-widest">X / TWITTER URL</label>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-xs text-neutral-600 hover:text-white transition-colors uppercase tracking-widest"
                >
                  [CONFIG]
                </button>
              </div>
              <input
                type="url"
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
                placeholder="https://x.com/username/status/..."
                className="w-full bg-transparent border-b border-neutral-700 py-3 text-lg focus:outline-none focus:border-white transition-colors placeholder:text-neutral-800"
                required
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !xUrl}
              className="w-full py-4 bg-white text-black uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              {status === "loading" ? "PROCESSING..." : "SEND TO KINDLE"}
            </button>

            {message && (
              <div className={`p-4 border text-center text-sm uppercase tracking-widest ${status === "error" ? "border-red-900 text-red-500" :
                status === "success" ? "border-green-900 text-green-500" :
                  "border-neutral-800 text-neutral-400"
                }`}>
                {message}
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
