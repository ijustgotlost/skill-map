"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      router.push(`/map?email=${encodeURIComponent(email.trim())}`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Free assessment</p>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 leading-tight mb-4">
            Your AI Skill Map
          </h1>
          <p className="text-base text-gray-600 leading-relaxed">
            The workforce isn&apos;t collapsing — it&apos;s recalibrating. Find out which AI skills your role actually needs and where you stand right now.
          </p>
        </div>

        <div className="space-y-3 mb-10">
          {[
            "See your top 3 AI skill gaps by domain",
            "Understand what employers in your field are requiring right now",
            "Get a concrete first step — not a course list",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="text-gray-300 mt-0.5">→</span>
              <p className="text-sm text-gray-600">{item}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white text-sm py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? "One moment…" : "Get my skill map →"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Your report is emailed to you. No spam.
        </p>
      </div>
    </main>
  );
}
