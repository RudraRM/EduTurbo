import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

/**
 * Same-origin relay to Groq's Whisper transcription API. The user's key is
 * forwarded from the `x-groq-key` header and never persisted.
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-groq-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing Groq API key." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(GROQ_AUDIO_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Groq. Check your connection and try again." },
      { status: 502 }
    );
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "text/plain",
      "cache-control": "no-store",
    },
  });
}
