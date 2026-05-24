import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import UserModel, { type UserDocument, type UserResponse } from "@/models/User";

export const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
export const OTP_RESEND_INTERVAL_SECONDS = 60;
export const OTP_LENGTH = 6;
export const NAME_MAX_LENGTH = 80;
export const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable.");
  }

  return secret;
}

export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  };
}

export function sanitizeUser(user: UserDocument): UserResponse {
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    email: user.email,
    isVerified: Boolean(user.isVerified),
    createdAt: user.createdAt,
  };
}

export function normalizeEmail(email: unknown) {
  return String(email || "").trim().toLowerCase();
}

export function normalizeName(name: unknown) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

export function normalizeUsername(username: unknown) {
  return String(username || "").trim();
}

export function validateSignupFields(input: {
  name: string;
  username: string;
  email: string;
}) {
  if (!input.email) {
    return "Email is required.";
  }

  if (!input.name) {
    return "Full name is required.";
  }

  if (input.name.length > NAME_MAX_LENGTH) {
    return `Full name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!input.username) {
    return "Username is required.";
  }

  if (!USERNAME_REGEX.test(input.username)) {
    return "Username must be 3-30 characters and use only letters, numbers, dot, underscore, or hyphen.";
  }

  return null;
}

export function signAuthToken(user: UserDocument) {
  return jwt.sign({ userId: String(user._id) }, getJwtSecret(), { expiresIn: "7d" });
}

export async function authenticateFromToken(token?: string | null) {
  if (!token) {
    throw new Error("Authentication required.");
  }

  await connectToDatabase();
  const payload = jwt.verify(token, getJwtSecret()) as { userId: string };
  const user = await UserModel.findById(payload.userId);

  if (!user) {
    throw new Error("Invalid session.");
  }

  return user;
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    return await authenticateFromToken(cookieStore.get("token")?.value ?? null);
  } catch {
    return null;
  }
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  try {
    return await authenticateFromToken(request.cookies.get("token")?.value ?? null);
  } catch {
    return null;
  }
}

export async function requireApiUser(request: NextRequest) {
  try {
    const user = await authenticateFromToken(request.cookies.get("token")?.value ?? null);
    return { user };
  } catch {
    return {
      response: NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 },
      ),
    };
  }
}
