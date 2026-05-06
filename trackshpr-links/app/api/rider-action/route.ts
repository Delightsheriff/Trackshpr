import { NextRequest, NextResponse } from "next/server";
import { runRiderAction } from "@/lib/supabase-rpc";
import type { RiderActionPayload } from "@/lib/types";

function isPayload(value: unknown): value is RiderActionPayload {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.token === "string" &&
    (record.action === "pickup" ||
      record.action === "deliver" ||
      record.action === "fail")
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;

  if (!isPayload(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.action === "fail" && !body.note?.trim()) {
    return NextResponse.json(
      { error: "A failure reason is required." },
      { status: 400 },
    );
  }

  try {
    const order = await runRiderAction(body);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update this delivery.",
      },
      { status: 500 },
    );
  }
}
