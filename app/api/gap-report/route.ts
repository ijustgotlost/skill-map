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

  const prompt = `You are an AI workforce gap analyst. Write a personal gap report for this professional. Each gap is exactly 3 short sentences — no paragraphs, no run-ons.

PROFILE:
- Role: ${answers.role}
- Industry: ${answers.industry}
- Experience: ${answers.experience} (${experienceContext})
- AI tool usage: ${answers.usedAI}
- Biggest challenge: ${answers.biggestChallenge}
- Goal: ${answers.upskillGoal}
- Timeline: ${answers.timeline}
- Regulatory pressure: ${regulatoryDriver}

THEIR 3 GAPS:
${domainDetails.map((d, i) => `Gap ${i + 1}: **${d.name}**
Context: ${d.gap}`).join("\n\n")}

FORMAT — output exactly this, no extra text:

**[Gap 1 Domain Name]**
[One sentence: what this gap costs them specifically in their role right now.]
[One sentence: what employers in their industry are requiring that they don't have yet.]
[One sentence: what changes when they close it — one concrete outcome.]

**[Gap 2 Domain Name]**
[One sentence: how their biggest challenge (${answers.biggestChallenge}) is a direct symptom of this gap.]
[One sentence: what they're likely doing instead that signals this gap.]
[One sentence: what closes first when this is fixed.]

**[Gap 3 Domain Name]**
[One sentence: why ${regulatoryDriver} makes this urgent for their role and industry right now.]
[One sentence: what their goal (${answers.upskillGoal}) requires that they can't yet demonstrate.]
[One sentence: the specific credential, skill, or behavior that changes their positioning.]

[One final sentence: what opening across all 3 domains makes possible for a ${answers.experience}-year ${answers.role} in ${answers.industry}.]

Rules:
- Each sentence stands alone — no conjunctions connecting thoughts across sentences
- Every sentence is specific to their role, industry, and experience level
- Bold only domain names using **name**
- Never say: leverage, landscape, journey, empower, ecosystem, navigate
- No filler phrases like "In today's world" or "As AI continues to"
- Speak to someone who has been doing this job for years`;

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
