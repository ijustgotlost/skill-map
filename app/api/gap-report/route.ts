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

  const regulatoryDriver = getRegulatoryDriver(answers.industry, answers.role);
  const experienceContext = getExperienceContext(answers.experience);

  const prompt = `You are an AI workforce gap analyst. A professional completed the Your AI Skill Map assessment. Write a specific, personal gap report — not generic career advice.

THEIR PROFILE:
- Role: ${answers.role}
- Industry: ${answers.industry}
- Experience: ${answers.experience} (${experienceContext})
- AI tool experience: ${answers.usedAI}
- Biggest challenge: ${answers.biggestChallenge}
- Goal: ${answers.upskillGoal}
- Timeline: ${answers.timeline}
- Regulatory pressure on their role: ${regulatoryDriver}

THEIR TOP 3 SKILL GAPS (from Domain Model — 8 AI competency domains):
${domainDetails.map((d, i) => `GAP ${i + 1}: ${d.name}
What this domain covers: ${d.description}
What the gap looks like: ${d.gap}
First concrete step: ${d.firstStep}`).join("\n\n")}

Write exactly 3 numbered gap findings. Each finding is 2-3 sentences maximum. Use this structure for each:

GAP 1: [Domain name in bold — written as: **Domain Name**]
What it means for a [their role] in [their industry] specifically. What they are likely doing right now that signals this gap. What changes when they close it — one specific outcome, not a vague benefit.

GAP 2: Same structure. Connect to their biggest challenge directly. Name the real-world consequence they are already experiencing because of this gap.

GAP 3: Same structure. Connect to their goal (${answers.upskillGoal}). Name the regulatory or market pressure (${regulatoryDriver}) making this urgent for their industry specifically.

End with one sentence: what becoming proficient across these 3 domains makes possible for someone at their experience level in their specific role.

Rules:
- Never say "leverage," "landscape," "journey," or "empower"
- Speak to a professional who has been doing their job for years — not a student
- Every sentence must be specific to their role, industry, and experience level
- If their challenge is risk/compliance, lead with the regulatory pressure
- If their goal is leadership, frame gaps as what's blocking their credibility in the room
- If their goal is making a move, frame gaps as what's missing from their profile
- Max 180 words total across all 3 gaps plus closing sentence`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const reportText = message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({
    report: reportText,
    domains: domainDetails,
  });
}

function getRegulatoryDriver(industry: string, role: string): string {
  const i = industry.toLowerCase();
  const r = role.toLowerCase();
  if (i.includes("finance") || i.includes("banking") || i.includes("insurance")) return "SEC AI guidance and Basel AI risk frameworks require documented AI oversight";
  if (i.includes("health") || i.includes("medical") || i.includes("hospital")) return "FDA AI/ML guidance and HIPAA AI provisions require clinical AI validation";
  if (i.includes("government") || i.includes("federal") || i.includes("public sector")) return "NIST AI RMF and the Federal AI Executive Order require agency-level AI governance";
  if (r.includes("compliance") || r.includes("legal") || r.includes("risk")) return "EU AI Act and NIST AI RMF are creating new compliance obligations for this role";
  return "EU AI Act and ISO 42001 are setting new baseline requirements for enterprise AI governance";
}

function getExperienceContext(experience: string): string {
  if (experience === "0-2") return "early career — foundational gaps matter most";
  if (experience === "3-7") return "mid-career — transitional skills determine trajectory";
  if (experience === "8-15") return "senior — leadership credibility depends on AI fluency";
  if (experience === "15+") return "executive level — strategic AI literacy is table stakes";
  return "established professional";
}
