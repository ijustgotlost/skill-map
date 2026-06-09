export const DOMAINS = {
  AI_LITERACY: {
    name: "AI Literacy",
    description: "Understanding what AI systems actually do, how they make decisions, and what their limitations are — not technically, but conceptually enough to work alongside them and evaluate their outputs.",
    gap: "Most professionals at this level can name AI tools but cannot evaluate outputs critically, spot when a system is wrong, or explain AI decisions to stakeholders. Employers need level 3 — functional fluency.",
    firstStep: "Start by auditing one AI-generated output you use weekly. Identify one assumption it makes. That practice builds the critical eye employers are paying for.",
  },
  PROCESS_MAPPING: {
    name: "Process Mapping",
    description: "Identifying which parts of existing workflows can be automated, augmented, or redesigned with AI — and which cannot. Knowing where the handoffs are.",
    gap: "Most professionals document processes but have never analyzed them for AI fit. Employers need someone who can walk a workflow and immediately identify the three highest-ROI automation points.",
    firstStep: "Pick one process you own. Map every step. Mark which steps require human judgment. The rest is your AI opportunity list.",
  },
  TOOL_STACK: {
    name: "Tool Stack",
    description: "Knowing which AI tools exist for your function, how to evaluate them, and how to integrate them into existing systems without breaking what works.",
    gap: "Most professionals have tried one or two tools informally. Employers need someone who can evaluate five tools against a business requirement and make a recommendation with rationale.",
    firstStep: "Pick one task you do weekly. Find three AI tools that address it. Run the same task through all three. Write one sentence on each. That's tool evaluation.",
  },
  GOVERNANCE_RISK: {
    name: "Governance & Risk",
    description: "Understanding how AI introduces new categories of risk — bias, hallucination, data exposure, regulatory liability — and knowing how to build controls around them.",
    gap: "Most professionals treat AI risk like IT risk. Employers need someone who understands that AI risk is probabilistic, not binary — and can design oversight processes accordingly.",
    firstStep: "Read the EU AI Act's risk tier definitions. One hour. Map your organization's AI use cases to the tiers. That conversation puts you ahead of 90% of your peers.",
  },
  AGENT_DESIGN: {
    name: "Agent Design",
    description: "Understanding how AI agents work — what they can be given authority over, where they need human checkpoints, and how to scope them so they don't cause downstream problems.",
    gap: "Most professionals have no mental model for agents at all. Employers building AI-augmented teams need people who can define agent scope, set guardrails, and know when a human must stay in the loop.",
    firstStep: "The next time you use an AI tool, define its scope out loud: what is it allowed to decide, and what must it ask you first. That framing is the foundation of agent design.",
  },
  CHANGE_MANAGEMENT: {
    name: "Change Management",
    description: "Getting teams to actually adopt AI tools — addressing resistance, building confidence, and creating conditions where AI use becomes habitual rather than forced.",
    gap: "Most professionals can deploy a tool but cannot get their team to use it. Employers need someone who treats AI adoption as a behavior change problem, not a training problem.",
    firstStep: "Identify one person on your team who is resistant to an AI tool. Have a conversation about what specifically worries them. That conversation is change management.",
  },
  DATA_FUNDAMENTALS: {
    name: "Data Fundamentals",
    description: "Understanding what data AI systems need, what good data looks like, and what happens to AI outputs when the data is wrong, incomplete, or biased.",
    gap: "Most professionals trust AI outputs without asking where the data came from. Employers need someone who can interrogate a dataset before trusting what the model says.",
    firstStep: "The next time an AI tool gives you an output, ask: what data was this trained on? If you can't answer, that's your gap.",
  },
  AI_STRATEGY: {
    name: "AI Strategy",
    description: "Connecting AI investment to business outcomes — knowing which bets to make, how to sequence them, and how to communicate AI roadmaps to leadership and boards.",
    gap: "Most professionals can list AI use cases but cannot prioritize them or connect them to P&L. Employers need someone who can build a 12-month AI roadmap and defend it in a budget conversation.",
    firstStep: "Write down the three AI investments your organization should make in the next year. Add a one-line business case to each. That document is the beginning of an AI strategy.",
  },
} as const;

export type DomainKey = keyof typeof DOMAINS;

export const ROLE_DOMAIN_WEIGHTS: Record<string, Partial<Record<DomainKey, number>>> = {
  "executive": { AI_STRATEGY: 3, GOVERNANCE_RISK: 3, CHANGE_MANAGEMENT: 2, AI_LITERACY: 1 },
  "manager": { CHANGE_MANAGEMENT: 3, PROCESS_MAPPING: 3, AI_STRATEGY: 2, AI_LITERACY: 2 },
  "hr": { CHANGE_MANAGEMENT: 3, AI_LITERACY: 2, GOVERNANCE_RISK: 2, PROCESS_MAPPING: 1 },
  "finance": { DATA_FUNDAMENTALS: 3, GOVERNANCE_RISK: 3, AI_LITERACY: 2, PROCESS_MAPPING: 2 },
  "legal": { GOVERNANCE_RISK: 3, AI_LITERACY: 3, AI_STRATEGY: 1, DATA_FUNDAMENTALS: 2 },
  "marketing": { TOOL_STACK: 3, AI_LITERACY: 2, PROCESS_MAPPING: 2, DATA_FUNDAMENTALS: 1 },
  "operations": { PROCESS_MAPPING: 3, TOOL_STACK: 2, CHANGE_MANAGEMENT: 2, DATA_FUNDAMENTALS: 2 },
  "product": { AGENT_DESIGN: 3, AI_STRATEGY: 3, PROCESS_MAPPING: 2, AI_LITERACY: 2 },
  "compliance": { GOVERNANCE_RISK: 3, AI_LITERACY: 3, DATA_FUNDAMENTALS: 2, AI_STRATEGY: 1 },
  "it": { TOOL_STACK: 3, AGENT_DESIGN: 3, DATA_FUNDAMENTALS: 2, GOVERNANCE_RISK: 2 },
  "default": { AI_LITERACY: 3, GOVERNANCE_RISK: 2, PROCESS_MAPPING: 2, TOOL_STACK: 1 },
};

export type UserAnswers = {
  role: string;
  industry: string;
  usedAI: "yes" | "no" | "sometimes";
  biggestChallenge: string;
  upskillGoal: string;
  timeline: string;
  email: string;
};

export function scoreGaps(answers: UserAnswers): DomainKey[] {
  const roleKey = detectRoleKey(answers.role);
  const weights = { ...ROLE_DOMAIN_WEIGHTS["default"], ...ROLE_DOMAIN_WEIGHTS[roleKey] };

  if (answers.biggestChallenge === "keeping-up") weights["AI_LITERACY"] = (weights["AI_LITERACY"] ?? 0) + 2;
  if (answers.biggestChallenge === "team-adoption") weights["CHANGE_MANAGEMENT"] = (weights["CHANGE_MANAGEMENT"] ?? 0) + 2;
  if (answers.biggestChallenge === "risk-compliance") weights["GOVERNANCE_RISK"] = (weights["GOVERNANCE_RISK"] ?? 0) + 2;
  if (answers.biggestChallenge === "leadership-case") weights["AI_STRATEGY"] = (weights["AI_STRATEGY"] ?? 0) + 2;

  if (answers.usedAI === "no") weights["AI_LITERACY"] = (weights["AI_LITERACY"] ?? 0) + 1;
  if (answers.upskillGoal === "lead-it") { weights["AI_STRATEGY"] = (weights["AI_STRATEGY"] ?? 0) + 2; weights["CHANGE_MANAGEMENT"] = (weights["CHANGE_MANAGEMENT"] ?? 0) + 1; }
  if (answers.upskillGoal === "make-a-move") { weights["AI_LITERACY"] = (weights["AI_LITERACY"] ?? 0) + 1; weights["TOOL_STACK"] = (weights["TOOL_STACK"] ?? 0) + 2; }

  return (Object.entries(weights) as [DomainKey, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);
}

function detectRoleKey(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("ceo") || r.includes("coo") || r.includes("cto") || r.includes("chief") || r.includes("vp") || r.includes("vice president") || r.includes("director")) return "executive";
  if (r.includes("manager") || r.includes("lead") || r.includes("head of")) return "manager";
  if (r.includes("hr") || r.includes("human resources") || r.includes("people")) return "hr";
  if (r.includes("finance") || r.includes("financial") || r.includes("accounting") || r.includes("cfo")) return "finance";
  if (r.includes("legal") || r.includes("counsel") || r.includes("attorney")) return "legal";
  if (r.includes("marketing") || r.includes("brand") || r.includes("content") || r.includes("growth")) return "marketing";
  if (r.includes("operations") || r.includes("ops") || r.includes("supply chain") || r.includes("logistics")) return "operations";
  if (r.includes("product") || r.includes("pm ") || r.includes("program")) return "product";
  if (r.includes("compliance") || r.includes("risk") || r.includes("audit")) return "compliance";
  if (r.includes("it ") || r.includes("technology") || r.includes("systems") || r.includes("data")) return "it";
  return "default";
}
