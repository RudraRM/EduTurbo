import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-nvidia-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing NVIDIA NIM API key." }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(NVIDIA_CHAT_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: await request.text(),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach NVIDIA NIM. Check your connection and try again." },
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
