import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { parseIceServers } from "@/lib/rtc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  return NextResponse.json({
    iceServers: parseIceServers(),
  });
}
