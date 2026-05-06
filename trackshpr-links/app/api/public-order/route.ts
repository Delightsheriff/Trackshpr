import { NextRequest, NextResponse } from "next/server";
import { getPublicOrder } from "@/lib/supabase-rpc";

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind");
  const token = request.nextUrl.searchParams.get("token");

  if ((kind !== "customer" && kind !== "rider") || !token) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const order = await getPublicOrder(kind, token);

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load this link.",
      },
      { status: 500 },
    );
  }
}
