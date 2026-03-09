import { NextResponse } from "next/server";
import { isGoogleAuthEnabled } from "@/lib/auth";

export async function GET() {
  const google = await isGoogleAuthEnabled();
  return NextResponse.json({ google });
}
