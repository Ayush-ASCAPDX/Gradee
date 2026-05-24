import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, sanitizeUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import UserModel from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    await connectToDatabase();
    const users = await UserModel.find({
      _id: { $ne: auth.user._id },
      isVerified: true,
    })
      .sort({ name: 1 })
      .select("_id name username email isVerified createdAt");

    return NextResponse.json({
      users: users.map(sanitizeUser),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
