import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

import { parseYouTubeId } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function fetchTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: "no-store" }
    );
    if (response.ok) {
      const data = await response.json();
      if (typeof data?.title === "string" && data.title) return data.title;
    }
  } catch {
    // fall through to placeholder title
  }
  return "YouTube video";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";
  const videoId = parseYouTubeId(url);

  if (!videoId) {
    return NextResponse.json(
      { error: "That doesn't look like a valid YouTube URL." },
      { status: 400 }
    );
  }

  try {
    const [segments, title] = await Promise.all([
      YoutubeTranscript.fetchTranscript(videoId),
      fetchTitle(videoId),
    ]);

    const transcript = segments
      .map((segment) => segment.text)
      .join(" ")
      .replace(/&amp;#39;/g, "'")
      .replace(/&amp;quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    if (!transcript) {
      return NextResponse.json(
        { error: "This video has no captions available to import." },
        { status: 422 }
      );
    }

    return NextResponse.json({ videoId, title, transcript });
  } catch {
    return NextResponse.json(
      {
        error:
          "Couldn't fetch a transcript for this video. It may have captions disabled.",
      },
      { status: 422 }
    );
  }
}
