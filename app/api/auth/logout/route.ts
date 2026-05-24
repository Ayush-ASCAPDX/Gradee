import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set("token", "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
  return response;
}
