import { NextResponse } from "next/server";
import { listPages } from "@/lib/platform/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const pages = await listPages();
  return NextResponse.json({ pages });
}
