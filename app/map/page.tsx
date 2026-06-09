"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UserAnswers } from "@/lib/domains";

type Step =
  | "email"
  | "role"
  | "industry"
  | "experience"
  | "used-ai"
  | "challenge"
  | "upskill-goal"
  | "timeline"
  | "generating"
  | "report";

type DomainResult = {
  key: string;
  name: string;
  description: string;
  gap: string;
  firstStep: string;
};

const TOTAL_STEPS = 7;

const stepIndex: Record<Step, number> = {
  email: 0,
  role: 1,
  industry: 2,
  experience: 3,
  "used-ai": 4,
  challenge: 5,
  "upskill-goal": 6,
  timeline: 7,
  generating: 8,
  report: 9,
};

export default function Page() {
  return (
    <Suspense>
      <SkillMap />
    </Suspense>
  );
}

function SkillMap() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  const [step, setStep] = useState<Step>(emailParam ? "role" : "email");
  const [answers, setAnswers] = useState<Partial<UserAnswers>>(emailParam ? { email: emailParam } : {});
  const [inputValue, setInputValue] = useState("");
  const [report, setReport] = useState<string>("");
  const [domains, setDomains] = useState<DomainResult[]>([]);
  const [waitlisted, setWaitlisted] = useState(false);
  const [waitlisting, setWaitlisting] = useState(false);
  const [error, setError] = useState("");

  const progress = Math.min((stepIndex[step] / TOTAL_STEPS) * 100, 100);

  function choose(field: keyof UserAnswers, value: string, next: Step) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setStep(next);
  }

  async function submitText(field: keyof UserAnswers, next: Step) {
    if (!inputValue.trim()) return;
    const newAnswers = { ...answers, [field]: inputValue.trim() };
    setAnswers(newAnswers);
    setInputValue("");
    setStep(next);
  }

  async function handleTimelineChoice(value: string) {
    const newAnswers = { ...answers, timeline: value };
    setAnswers(newAnswers);
    setStep("generating");
    try {
      const res = await fetch("/api/gap-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnswers),
      });
      const data = await res.json();
      setReport(data.report);
      setDomains(data.domains);
      setStep("report");
    } catch {
      setError("Something went wrong generating your report. Please try again.");
      setStep("timeline");
    }
  }

  async function joinWaitlist() {
    setWaitlisting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: answers.email, listId: 7 }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setWaitlisted(true);
    } catch {
      setError("Couldn't add you. Try again.");
    } finally {
      setWaitlisting(false);
    }
  }

  const isQuestionStep = !["email", "generating", "report"].includes(step);

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-start px-4 pt-16 pb-24">
      <div className="w-full max-w-lg">

        <div className="mb-10">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">Your AI Skill Map</p>
          {isQuestionStep && (
            <div className="h-0.5 bg-zinc-800 rounded-full">
              <div
                className="h-0.5 bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {step === "email" && (
          <Card>
            <Question>Enter your email to unlock your report.</Question>
            <p className="text-sm text-zinc-400 mb-6">7 questions. Personalized AI gap report. Takes 2 minutes.</p>
            <input
              type="email"
              placeholder="your@email.com"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitText("email", "role")}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 mb-4"
              autoFocus
            />
            <Btn onClick={() => submitText("email", "role")}>Start →</Btn>
          </Card>
        )}

        {step === "role" && (
          <Card>
            <Question>What&apos;s your current role or job title?</Question>
            <input
              type="text"
              placeholder="e.g. Compliance Manager, HR Director, VP of Operations"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitText("role", "industry")}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 mb-4"
              autoFocus
            />
            <Btn onClick={() => submitText("role", "industry")}>Continue →</Btn>
          </Card>
        )}

        {step === "industry" && (
          <Card>
            <Question>Which industry are you in?</Question>
            <input
              type="text"
              placeholder="e.g. Financial Services, Healthcare, Government, Retail"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitText("industry", "experience")}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 mb-4"
              autoFocus
            />
            <Btn onClick={() => submitText("industry", "experience")}>Continue →</Btn>
          </Card>
        )}

        {step === "experience" && (
          <Card>
            <Question>How many years have you been working in your field?</Question>
            <Options>
              <Opt onClick={() => choose("experience", "0-2", "used-ai")}>0–2 years</Opt>
              <Opt onClick={() => choose("experience", "3-7", "used-ai")}>3–7 years</Opt>
              <Opt onClick={() => choose("experience", "8-15", "used-ai")}>8–15 years</Opt>
              <Opt onClick={() => choose("experience", "15+", "used-ai")}>15+ years</Opt>
            </Options>
          </Card>
        )}

        {step === "used-ai" && (
          <Card>
            <Question>Have you used any AI tools in your work — even casually?</Question>
            <Options>
              <Opt onClick={() => choose("usedAI", "yes", "challenge")}>Yes — I use them regularly</Opt>
              <Opt onClick={() => choose("usedAI", "sometimes", "challenge")}>Sometimes — a few times</Opt>
              <Opt onClick={() => choose("usedAI", "no", "challenge")}>Not yet</Opt>
            </Options>
          </Card>
        )}

        {step === "challenge" && (
          <Card>
            <Question>What&apos;s your biggest challenge with AI right now?</Question>
            <Options>
              <Opt onClick={() => choose("biggestChallenge", "keeping-up", "upskill-goal")}>Keeping up with what AI means for my role</Opt>
              <Opt onClick={() => choose("biggestChallenge", "team-adoption", "upskill-goal")}>Getting my team to adopt new tools</Opt>
              <Opt onClick={() => choose("biggestChallenge", "risk-compliance", "upskill-goal")}>Understanding risk and compliance around AI</Opt>
              <Opt onClick={() => choose("biggestChallenge", "leadership-case", "upskill-goal")}>Making the case to leadership</Opt>
            </Options>
          </Card>
        )}

        {step === "upskill-goal" && (
          <Card>
            <Question>What&apos;s your goal with AI right now?</Question>
            <Options>
              <Opt onClick={() => choose("upskillGoal", "stay-current", "timeline")}>Just stay current — understand what it means for my role</Opt>
              <Opt onClick={() => choose("upskillGoal", "use-at-work", "timeline")}>Use it at work — apply AI tools day-to-day</Opt>
              <Opt onClick={() => choose("upskillGoal", "lead-it", "timeline")}>Lead it — drive AI adoption or strategy on my team</Opt>
              <Opt onClick={() => choose("upskillGoal", "make-a-move", "timeline")}>Make a move — position for an AI-focused role or promotion</Opt>
            </Options>
          </Card>
        )}

        {step === "timeline" && (
          <Card>
            <Question>How soon are you looking to build this skill?</Question>
            <Options>
              <Opt onClick={() => handleTimelineChoice("now")}>I&apos;m actively working on it now</Opt>
              <Opt onClick={() => handleTimelineChoice("3-months")}>Within the next 3 months</Opt>
              <Opt onClick={() => handleTimelineChoice("exploring")}>Just exploring for now</Opt>
              <Opt onClick={() => handleTimelineChoice("required")}>My company is requiring it</Opt>
            </Options>
          </Card>
        )}

        {step === "generating" && (
          <div className="py-16 text-center">
            <p className="text-zinc-400 text-sm animate-pulse">Mapping your gaps across 8 AI competency domains…</p>
          </div>
        )}

        {step === "report" && (
          <div className="space-y-8">

            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-6">Your AI Skill Map</p>
              <div className="space-y-6">
                {report.split(/\n\n+/).filter(Boolean).map((block, i) => (
                  <div key={i} className="flex gap-5">
                    <span className="text-4xl font-black text-amber-400 leading-none shrink-0 mt-0.5">{i + 1}</span>
                    <div className="space-y-2">
                      {block.split(/(?<=[.!?])\s+/).filter(Boolean).map((sentence, j) => (
                        <p
                          key={j}
                          className="text-sm text-zinc-200 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: sentence.replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-bold">$1</span>') }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6 space-y-3">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Your top 3 gaps — where to start</p>
              {domains.map((d, i) => (
                <div key={d.key} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <p className="text-sm font-bold text-amber-400 mb-2">{i + 1}. {d.name}</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{d.firstStep}</p>
                </div>
              ))}
            </div>

            {!waitlisted ? (
              <button
                onClick={joinWaitlist}
                disabled={waitlisting}
                className="w-full bg-amber-400 text-zinc-950 font-bold text-sm py-4 rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50"
              >
                {waitlisting ? "Adding you…" : "Join the Cimulate waitlist →"}
              </button>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-1">You&apos;re on the list.</p>
                <p className="text-xs text-zinc-400">We&apos;ll reach out when your spot opens.</p>
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function Question({ children }: { children: React.ReactNode }) {
  return <p className="text-2xl font-bold text-white leading-snug mb-6">{children}</p>;
}

function Options({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function Opt({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 hover:border-amber-400 hover:text-white hover:bg-zinc-800 transition-colors"
    >
      {children}
    </button>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-zinc-800 text-white text-sm font-semibold py-3.5 rounded-lg border border-zinc-600 hover:bg-zinc-700 hover:border-zinc-500 transition-colors"
    >
      {children}
    </button>
  );
}
