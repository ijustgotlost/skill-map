import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, report, domains, role } = await req.json();

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Brevo not configured" }, { status: 500 });

  const domainList = domains
    .map((d: { name: string; firstStep: string }, i: number) => `<p><strong>${i + 1}. ${d.name}</strong><br/>${d.firstStep}</p>`)
    .join("");

  const emailBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="font-size: 22px; margin-bottom: 4px;">Your AI Skill Map</h2>
      <p style="color: #666; margin-top: 0;">Your personal gap report</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="white-space: pre-wrap; line-height: 1.7;">${report}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <h3 style="font-size: 16px;">Your top 3 gaps — where to start</h3>
      ${domainList}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 15px;">Ready to close these gaps?</p>
      <a href="https://cimulate.ai" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 15px;">Join the Cimulate waitlist →</a>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">You received this because you completed the Your AI Skill Map assessment.</p>
    </div>
  `;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Your AI Skill Map", email: "hello@cimulate.ai" },
      to: [{ email }],
      subject: `Your AI Skill Map — ${role} gap report`,
      htmlContent: emailBody,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
