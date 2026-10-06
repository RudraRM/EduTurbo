import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const NVIDIA_AUDIO_URL = "https://integrate.api.nvidia.com/v1/audio/transcriptions";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-nvidia-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing NVIDIA NIM API key." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(NVIDIA_AUDIO_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach NVIDIA NIM. Check your connection and try again." },
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
