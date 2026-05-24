import { NextRequest, NextResponse } from "next/server";
import {
  getCookieOptions,
  normalizeEmail,
  sanitizeUser,
  signAuthToken,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import OtpModel from "@/models/Otp";
import UserModel from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = normalizeEmail(body.email);
  const otp = String(body.otp || "").trim();

  if (!email || !otp) {
    return NextResponse.json(
      { error: "Email and OTP are required." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const otpRecord = await OtpModel.findOne({ email, otp });
    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OtpModel.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ error: "OTP has expired." }, { status: 400 });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 400 });
    }

    user.isVerified = true;
    await user.save();

    const token = signAuthToken(user);
    await OtpModel.deleteMany({ email });

    const response = NextResponse.json({
      message: "Logged in successfully.",
      user: sanitizeUser(user),
    });
    response.cookies.set("token", token, getCookieOptions());
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
