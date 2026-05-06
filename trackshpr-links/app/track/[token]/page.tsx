import { notFound } from "next/navigation";
import { CustomerTrackingPage } from "@/components/customer-tracking-page";
import { env } from "@/lib/env";
import { getPublicOrder } from "@/lib/supabase-rpc";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getPublicOrder("customer", token);

  if (!order) {
    notFound();
  }

  return <CustomerTrackingPage homeUrl={env.homeUrl} initialOrder={order} token={token} />;
}
