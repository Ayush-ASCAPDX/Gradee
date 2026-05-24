import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  OTP_RESEND_INTERVAL_SECONDS,
  normalizeEmail,
  normalizeName,
  normalizeUsername,
  validateSignupFields,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import OtpModel from "@/models/Otp";
import UserModel from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBucket = {
  count: number;
  resetAt: number;
};

declare global {
  var __gradeeOtpRateLimit__: Map<string, RequestBucket> | undefined;
}

const requestBuckets = global.__gradeeOtpRateLimit__ ?? new Map<string, RequestBucket>();
global.__gradeeOtpRateLimit__ = requestBuckets;

function generateOtp() {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function consumeRequestQuota(key: string) {
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, {
      count: 1,
      resetAt: now + 60 * 60 * 1000,
    });
    return true;
  }

  if (bucket.count >= 10) {
    return false;
  }

  bucket.count += 1;
  requestBuckets.set(key, bucket);
  return true;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = normalizeEmail(body.email);
  const name = normalizeName(body.name);
  const username = normalizeUsername(body.username);
  const isSignupAttempt = Boolean(name || username);
  const ipKey = request.headers.get("x-forwarded-for") || "local";

  if (!consumeRequestQuota(`${ipKey}:${email || "unknown"}`)) {
    return NextResponse.json(
      { error: "Too many OTP requests, please try again later." },
      { status: 429 },
    );
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (isSignupAttempt) {
    const validationError = validateSignupFields({ name, username, email });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
  }

  try {
    await connectToDatabase();
    let user = await UserModel.findOne({ email });

    if (!user) {
      if (!isSignupAttempt) {
        return NextResponse.json(
          { error: "No account found with this email. Please sign up first." },
          { status: 404 },
        );
      }

      const existingUsername = await UserModel.findOne({ username });
      if (existingUsername) {
        return NextResponse.json(
          { error: "That username is already in use." },
          { status: 409 },
        );
      }

      user = await UserModel.create({ email, name, username, isVerified: false });
    } else if (isSignupAttempt) {
      if (user.isVerified) {
        return NextResponse.json(
          {
            error: "An account with this email already exists. Please log in instead.",
          },
          { status: 409 },
        );
      }

      if (user.username !== username) {
        const existingUsername = await UserModel.findOne({
          username,
          _id: { $ne: user._id },
        });

        if (existingUsername) {
          return NextResponse.json(
            { error: "That username is already in use." },
            { status: 409 },
          );
        }
      }

      user.name = name;
      user.username = username;
      await user.save();
    }

    const recentOtp = await OtpModel.findOne({ email }).sort({ createdAt: -1 });
    if (recentOtp) {
      const secondsSinceLast = (Date.now() - recentOtp.createdAt.getTime()) / 1000;
      if (secondsSinceLast < OTP_RESEND_INTERVAL_SECONDS) {
        return NextResponse.json(
          {
            error: `Please wait ${Math.ceil(OTP_RESEND_INTERVAL_SECONDS - secondsSinceLast)} seconds before requesting a new OTP.`,
          },
          { status: 429 },
        );
      }
    }

    await OtpModel.deleteMany({ email });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await OtpModel.create({ email, otp, expiresAt });

    const html = `
      <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid #e5e7eb;">
          <div style="padding: 24px 30px; text-align: left; display: flex; align-items: center; gap: 8px;">
            <div style="font-size: 22px; font-weight: 800; color: #8b5cf6; letter-spacing: -0.5px; display: inline-block;">
              <span style="vertical-align: middle;">Gradee</span>
            </div>
          </div>
          <div style="padding: 0 30px;">
            <div style="background-color: #131316; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
              <img src="cid:gradee_email_banner" style="width: 100%; height: auto; display: block; max-width: 100%;" alt="Welcome to Gradee">
              <div style="padding: 24px; text-align: center;">
                <h1 style="font-size: 24px; font-weight: 800; margin: 0 0 6px 0; color: #ffffff; letter-spacing: -0.5px;">Welcome to Gradee</h1>
                <p style="font-size: 13px; margin: 0; color: #a1a1aa; font-weight: 400; letter-spacing: 0.5px;">The modern student portal</p>
              </div>
            </div>
          </div>
          <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 28px 30px;">
          <div style="padding: 0 30px; text-align: center;">
            <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0; font-family: 'Outfit', sans-serif;">Here is your OTP :</h2>
            <div style="display: inline-block; border: 1px solid #1f2937; border-radius: 8px; padding: 18px 48px; background: #ffffff; margin: 8px 0 18px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
              <span style="font-size: 34px; font-weight: 800; color: #111827; letter-spacing: 10px; font-family: monospace; display: inline-block; padding-left: 10px;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #6b7280; max-width: 380px; margin: 0 auto 24px auto; line-height: 1.6; font-family: 'Outfit', sans-serif;">
              Find your best path in modern and smarter way, anytime, anywhere.
            </p>
          </div>
          <div style="background-color: #0b0b0c; padding: 32px 30px; text-align: left; color: #9ca3af; font-size: 12px; line-height: 1.6; border-radius: 0 0 20px 20px;">
            <h4 style="color: #ffffff; font-size: 14px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Outfit', sans-serif;">Need help?</h4>
            <p style="margin: 0 0 24px 0; color: #a1a1aa; font-family: 'Outfit', sans-serif;">
              Call us at <strong style="color: #ffffff;">+91 (000)-0000-000</strong>, start getting your best team, or visit our <a href="#" style="color: #8b5cf6; text-decoration: underline;">Help Center</a> anytime.
            </p>
            <div style="border-top: 1px solid #1f2937; padding-top: 20px; font-size: 11px; color: #6b7280; font-family: 'Outfit', sans-serif;">
              No longer want these emails? <a href="#" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>, <a href="#" style="color: #9ca3af; text-decoration: underline;">update preferences</a>, or <a href="#" style="color: #9ca3af; text-decoration: underline;">view in browser</a>.<br>
              123 Anywhere St., Any City, ST 12345
            </div>
          </div>
        </div>
      </div>
    `;

    const bannerPath = path.join(process.cwd(), "public", "gradee_email_banner.svg");
    const attachments = fs.existsSync(bannerPath)
      ? [
          {
            filename: "gradee_email_banner.svg",
            path: bannerPath,
            cid: "gradee_email_banner",
          },
        ]
      : [];

    await sendMail(email, "Your Gradee OTP", html, attachments);

    return NextResponse.json({
      message: "OTP sent. Please check your email.",
      mode: isSignupAttempt ? "signup" : "login",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
