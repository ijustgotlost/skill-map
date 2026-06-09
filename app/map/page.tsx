"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UserAnswers } from "@/lib/domains";

type Step =
  | "email"
  | "role"
  | "industry"
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

const TOTAL_STEPS = 6;

const stepIndex: Record<Step, number> = {
  email: 0,
  role: 1,
  industry: 2,
  "used-ai": 3,
  challenge: 4,
  "upskill-goal": 5,
  timeline: 6,
  generating: 7,
  report: 8,
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
  const [emailSent, setEmailSent] = useState(false);
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

    if (next === "generating") {
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
    } else {
      setStep(next);
    }
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

  async function sendEmail() {
    try {
      await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: answers.email, report, domains, role: answers.role }),
      });
      setEmailSent(true);
    } catch {
      setError("Couldn't send email. Try again.");
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-start px-4 pt-16 pb-24">
      <div className="w-full max-w-lg">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Your AI Skill Map</h1>
          <p className="text-sm text-gray-500 mt-1">Find out exactly where your AI gap is — and what to do first.</p>
        </div>

        {step !== "email" && step !== "generating" && step !== "report" && (
          <div className="mb-8">
            <div className="h-1 bg-gray-100 rounded-full">
              <div
                className="h-1 bg-gray-900 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {step === "email" && (
          <Card>
            <Question>Enter your email to unlock your report.</Question>
            <p className="text-sm text-gray-500 mb-6">Answer 6 questions. Your personalized gap report generates at the end.</p>
            <input
              type="email"
              placeholder="your@email.com"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitText("email", "role")}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
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
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
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
              onKeyDown={(e) => e.key === "Enter" && submitText("industry", "used-ai")}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
              autoFocus
            />
            <Btn onClick={() => submitText("industry", "used-ai")}>Continue →</Btn>
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
          <Card>
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm animate-pulse">Mapping your gaps across 8 AI competency domains…</p>
            </div>
          </Card>
        )}

        {step === "report" && (
          <div className="space-y-6">
            <div className="border border-gray-100 rounded-xl p-6 bg-gray-50">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Your gap report</p>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{report}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Your top 3 gaps</p>
              {domains.map((d, i) => (
                <div key={d.key} className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{i + 1}. {d.name}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{d.gap}</p>
                  <p className="text-xs text-gray-500 italic">First step: {d.firstStep}</p>
                </div>
              ))}
            </div>

            <div className="border border-gray-900 rounded-xl p-6">
              <p className="text-sm font-semibold text-gray-900 mb-1">Ready to close these gaps?</p>
              <p className="text-sm text-gray-600 mb-4">Cimulate trains non-technical professionals on exactly these domains — through real work scenarios, not slides.</p>
              <a
                href="https://cimulate.ai"
                className="inline-block bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Join the waitlist →
              </a>
            </div>

            {!emailSent ? (
              <div className="text-center">
                <button
                  onClick={sendEmail}
                  className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-900 transition-colors"
                >
                  Send this report to {answers.email}
                </button>
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">Report sent. Check your inbox.</p>
                  <p className="text-xs text-gray-500 mt-1">While you wait — watch this.</p>
                </div>

                <div className="rounded-xl overflow-hidden aspect-video w-full">
                  <iframe
                    src={process.env.NEXT_PUBLIC_NOW_WHAT_VIDEO}
                    title="What to do with your AI skill gap"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>

                {(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || process.env.NEXT_PUBLIC_SOCIAL_TIKTOK) && (
                  <div className="text-center space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Follow for weekly breakdowns</p>
                    <div className="flex justify-center gap-4">
                      {process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE && <a href={process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-2">YouTube</a>}
                      {process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN && <a href={process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-2">LinkedIn</a>}
                      {process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM && <a href={process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-2">Instagram</a>}
                      {process.env.NEXT_PUBLIC_SOCIAL_TIKTOK && <a href={process.env.NEXT_PUBLIC_SOCIAL_TIKTOK} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-gray-900 underline underline-offset-2">TikTok</a>}
                    </div>
                  </div>
                )}
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
  return <p className="text-lg font-medium text-gray-900 leading-snug mb-4">{children}</p>;
}

function Options({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function Opt({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
    >
      {children}
    </button>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gray-900 text-white text-sm py-3 rounded-lg hover:bg-gray-700 transition-colors"
    >
      {children}
    </button>
  );
}
