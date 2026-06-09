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
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
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

  async function sendEmail() {
    setEmailSending(true);
    try {
      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: answers.email, report, domains, role: answers.role }),
      });
      if (!res.ok) throw new Error("send failed");
      setEmailSent(true);
    } catch {
      setError("Couldn't send email. Try again.");
    } finally {
      setEmailSending(false);
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
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-amber-400 uppercase tracking-widest mb-5">Your gap report</p>
              <div className="space-y-5">
                {report.split(/\n\n+/).filter(Boolean).map((para, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-3xl font-bold text-amber-400 leading-none mt-0.5 shrink-0">{i + 1}</span>
                    <p className="text-sm text-zinc-200 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-semibold">$1</span>') }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-5 space-y-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">First steps</p>
              {domains.map((d, i) => (
                <div key={d.key} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <p className="text-xs font-semibold text-amber-400 mb-1">{i + 1}. {d.name}</p>
                  <p className="text-xs text-zinc-300 leading-relaxed">{d.firstStep}</p>
                </div>
              ))}
            </div>

            {!emailSent ? (
              <button
                onClick={sendEmail}
                disabled={emailSending}
                className="w-full bg-amber-400 text-zinc-950 font-semibold text-sm py-4 rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50 mt-2"
              >
                {emailSending ? "Sending…" : `Send this report to ${answers.email} →`}
              </button>
            ) : (
              <div className="space-y-5">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm font-semibold text-white mb-1">Report sent. Check your inbox.</p>
                  <p className="text-xs text-zinc-400">While you wait — watch this.</p>
                </div>

                {process.env.NEXT_PUBLIC_NOW_WHAT_VIDEO && (
                  <div className="rounded-xl overflow-hidden aspect-video w-full">
                    <iframe
                      src={process.env.NEXT_PUBLIC_NOW_WHAT_VIDEO}
                      title="What to do with your AI skill gap"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                )}

                <div className="bg-zinc-900 border border-amber-400 rounded-xl p-5">
                  <p className="text-sm font-semibold text-white mb-1">Ready to close these gaps?</p>
                  <p className="text-xs text-zinc-400 mb-4">Cimulate trains non-technical professionals on exactly these domains — through real work scenarios, not slides.</p>
                  <a
                    href="https://cimulate.ai"
                    className="inline-block bg-amber-400 text-zinc-950 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-amber-300 transition-colors"
                  >
                    Join the waitlist →
                  </a>
                </div>

                {(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || process.env.NEXT_PUBLIC_SOCIAL_TIKTOK) && (
                  <div className="text-center space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Follow for weekly breakdowns</p>
                    <div className="flex justify-center gap-4">
                      {process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE && <a href={process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-white transition-colors">YouTube</a>}
                      {process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN && <a href={process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-white transition-colors">LinkedIn</a>}
                      {process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM && <a href={process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-white transition-colors">Instagram</a>}
                      {process.env.NEXT_PUBLIC_SOCIAL_TIKTOK && <a href={process.env.NEXT_PUBLIC_SOCIAL_TIKTOK} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-white transition-colors">TikTok</a>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!emailSent && (
              <div className="border border-zinc-800 rounded-xl p-5">
                <p className="text-sm font-semibold text-white mb-1">Ready to close these gaps?</p>
                <p className="text-xs text-zinc-400 mb-4">Cimulate trains non-technical professionals on exactly these domains — through real work scenarios, not slides.</p>
                <a
                  href="https://cimulate.ai"
                  className="inline-block bg-zinc-800 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Join the waitlist →
                </a>
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
  return <p className="text-xl font-medium text-white leading-snug mb-5">{children}</p>;
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
