import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) return NextResponse.json({ error: "Brevo not configured" }, { status: 500 });

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      listIds: [Number(process.env.BREVO_LIST_ID) || 2],
      updateEnabled: true,
    }),
  });

  if (!res.ok && res.status !== 201 && res.status !== 204) {
    const err = await res.text();
    console.error("Brevo subscribe error:", res.status, err);
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
