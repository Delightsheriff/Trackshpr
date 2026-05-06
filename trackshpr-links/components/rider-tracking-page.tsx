"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatAmount, getBrandColor, getBusinessName, getStatusLabel } from "@/lib/format";
import type { OrderStatus, PublicTrackingOrder, ReportOption } from "@/lib/types";
import { Timeline } from "@/components/timeline";

const reportOptions: ReportOption[] = [
  {
    label: "Customer not available",
    subtitle: "The customer is not reachable or unavailable.",
  },
  {
    label: "Wrong address",
    subtitle: "The delivery address does not match the drop-off point.",
  },
  {
    label: "Item damaged",
    subtitle: "The package arrived damaged or unsafe to deliver.",
  },
  {
    label: "Other",
    subtitle: "Something else happened on this delivery.",
  },
];

async function getOptionalCoords() {
  if (!("geolocation" in navigator)) {
    return null;
  }

  return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 },
    );
  });
}

export function RiderTrackingPage({
  token,
  initialOrder,
  homeUrl,
}: {
  token: string;
  initialOrder: PublicTrackingOrder;
  homeUrl: string;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const response = await fetch(`/api/public-order?kind=rider&token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });

        if (!response.ok) return;

        const body = (await response.json()) as { order?: PublicTrackingOrder };
        if (alive && body.order) {
          setOrder(body.order);
          setError(null);
        }
      } catch {
        if (alive) {
          setError("Live updates are temporarily unavailable.");
        }
      }
    };

    const interval = window.setInterval(load, 15000);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [token]);

  const status = order.status as OrderStatus;
  const brandColor = getBrandColor(order);
  const businessName = getBusinessName(order);

  const primaryLabel = useMemo(() => {
    if (status === "pending") return "I've Picked Up the Item";
    if (status === "picked_up" || status === "in_transit") return "Delivery Complete";
    return null;
  }, [status]);

  const runAction = async (action: "pickup" | "deliver" | "fail", note?: string) => {
    setBusy(true);
    setError(null);

    try {
      const coords = await getOptionalCoords();
      const response = await fetch("/api/rider-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          token,
          note,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { order?: PublicTrackingOrder; error?: string }
        | null;

      if (!response.ok || !body?.order) {
        throw new Error(body?.error || "Could not update this delivery.");
      }

      setOrder(body.order);
      setReportOpen(false);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not update this delivery.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="hero panel">
        <div className="brand-lockup">
          {order.profile.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={businessName} className="brand-logo" src={order.profile.logo_url} />
          ) : (
            <div className="brand-logo fallback" style={{ backgroundColor: brandColor }} />
          )}
          <div>
            <div className="brand-title">{businessName}</div>
            <div className="brand-subtitle">Rider delivery link</div>
          </div>
        </div>

        <div className="hero-grid">
          <div>
            <div className={`status-pill status-${status}`}>{getStatusLabel(status)}</div>
            <h1 className="hero-title">{order.item}</h1>
            <p className="hero-copy">
              Deliver to {order.customer_name || "Customer"}
            </p>
          </div>
          <div className="hero-badge">
            #{order.order_number ?? order.id.slice(0, 6).toUpperCase()}
          </div>
        </div>
      </section>

      <section className="panel section-gap">
        <div className="section-head">
          <h2>Delivery details</h2>
        </div>
        <dl className="details-list">
          <div className="detail-row">
            <dt>Customer</dt>
            <dd>{order.customer_name || "Customer"}</dd>
          </div>
          <div className="detail-row">
            <dt>Address</dt>
            <dd>{order.delivery_address || "No address added"}</dd>
          </div>
          <div className="detail-row">
            <dt>Item</dt>
            <dd>{order.item}</dd>
          </div>
          <div className="detail-row">
            <dt>Amount to collect</dt>
            <dd className="mono">{formatAmount(order.delivery_fee)}</dd>
          </div>
        </dl>
      </section>

      <Timeline events={order.events} />

      <section className="foot-actions">
        {primaryLabel ? (
          <button
            className="primary-button"
            disabled={busy}
            onClick={() =>
              void runAction(status === "pending" ? "pickup" : "deliver")
            }
            style={{ backgroundColor: brandColor }}
            type="button"
          >
            {busy ? "Working..." : primaryLabel}
          </button>
        ) : null}

        {(status === "pending" || status === "picked_up" || status === "in_transit") ? (
          <button
            className="problem-button"
            disabled={busy}
            onClick={() => setReportOpen(true)}
            type="button"
          >
            Report a problem
          </button>
        ) : null}

        <Link className="secondary-link" href={homeUrl}>
          Powered by Trackshpr
        </Link>
        {error ? <p className="muted center-text">{error}</p> : null}
      </section>

      {reportOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="section-head">
              <h2>Report a problem</h2>
            </div>
            <p className="muted">
              This marks the order as failed and leaves the reason in the timeline.
            </p>
            <div className="option-list">
              {reportOptions.map((option) => (
                <button
                  className="option-card"
                  key={option.label}
                  onClick={() => void runAction("fail", option.label)}
                  type="button"
                >
                  <span className="option-title">{option.label}</span>
                  <span className="option-subtitle">{option.subtitle}</span>
                </button>
              ))}
            </div>
            <button
              className="secondary-button"
              onClick={() => setReportOpen(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
