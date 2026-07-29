import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Same-origin relay to Groq's chat completions API.
 *
 * The caller supplies their own Groq key in the `x-groq-key` header. The key
 * is forwarded upstream and never logged or stored — this route exists purely
 * so browsers can stream completions without CORS constraints.
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-groq-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing Groq API key." }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: await request.text(),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Groq. Check your connection and try again." },
      { status: 502 }
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}
