import { NextRequest, NextResponse } from "next/server";
import {
  NAME_MAX_LENGTH,
  USERNAME_REGEX,
  normalizeName,
  normalizeUsername,
  requireApiUser,
  sanitizeUser,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import UserModel from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  return NextResponse.json({ user: sanitizeUser(auth.user) });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    await connectToDatabase();
    const body = await request.json();
    const name = normalizeName(body.name);
    const username = normalizeUsername(body.username);

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (name.length > NAME_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${NAME_MAX_LENGTH} characters or fewer.` },
        { status: 400 },
      );
    }

    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-30 characters and use only letters, numbers, dot, underscore, or hyphen.",
        },
        { status: 400 },
      );
    }

    const existingUsername = await UserModel.findOne({
      username,
      _id: { $ne: auth.user._id },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "That username is already in use." },
        { status: 409 },
      );
    }

    auth.user.name = name;
    auth.user.username = username;
    await auth.user.save();

    return NextResponse.json({
      message: "Profile updated successfully.",
      user: sanitizeUser(auth.user),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
