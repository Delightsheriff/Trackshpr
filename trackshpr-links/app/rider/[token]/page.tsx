import { notFound } from "next/navigation";
import { RiderTrackingPage } from "@/components/rider-tracking-page";
import { env } from "@/lib/env";
import { getPublicOrder } from "@/lib/supabase-rpc";

export const dynamic = "force-dynamic";

export default async function RiderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getPublicOrder("rider", token);

  if (!order) {
    notFound();
  }

  return <RiderTrackingPage homeUrl={env.homeUrl} initialOrder={order} token={token} />;
}
