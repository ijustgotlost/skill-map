import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { DOMAINS, scoreGaps, UserAnswers } from "@/lib/domains";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const answers: UserAnswers = await req.json();

  const topDomains = scoreGaps(answers);
  const domainDetails = topDomains.map((key) => ({
    key,
    ...DOMAINS[key],
  }));

  const prompt = `You are an AI workforce gap analyst. A professional has completed the Your AI Skill Map assessment. Based on their answers, generate a concise, credible gap report.

THEIR ANSWERS:
- Role: ${answers.role}
- Industry: ${answers.industry}
- AI tool experience: ${answers.usedAI}
- Biggest challenge: ${answers.biggestChallenge}
- Upskill goal: ${answers.upskillGoal}
- Timeline: ${answers.timeline}

THEIR TOP 3 GAP DOMAINS (scored from Domain Model):
${domainDetails.map((d, i) => `${i + 1}. ${d.name}: ${d.description}`).join("\n")}

Write a gap report with this exact structure — no headers, no markdown, just clean readable paragraphs:

PARAGRAPH 1 (2-3 sentences): Address them directly by their role. Name the single most pressing gap for someone in their position right now, given their industry and challenge. Be specific — not generic.

PARAGRAPH 2 (2-3 sentences): Name their #2 gap domain. Explain what the absence of this skill looks like in practice for someone at their level. Name one consequence they're likely already experiencing.

PARAGRAPH 3 (2-3 sentences): Name their #3 gap domain. Connect it to their upskill goal specifically. Make it feel urgent but achievable.

CLOSING SENTENCE: One sentence. What closing this gap makes possible for them — not a promise, a realistic outcome.

Tone: Direct, credible, zero hype. Speak to a professional, not a student. Never use the word "leverage." Max 220 words total.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const reportText = message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({
    report: reportText,
    domains: domainDetails,
  });
}
