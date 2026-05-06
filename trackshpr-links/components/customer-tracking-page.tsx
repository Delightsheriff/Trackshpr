"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatAmount, formatDateTime, getBrandColor, getBusinessName, getPrimaryContactNumber, getStatusLabel } from "@/lib/format";
import type { OrderStatus, PublicTrackingOrder } from "@/lib/types";
import { Timeline } from "@/components/timeline";

export function CustomerTrackingPage({
  token,
  initialOrder,
  homeUrl,
}: {
  token: string;
  initialOrder: PublicTrackingOrder;
  homeUrl: string;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const response = await fetch(`/api/public-order?kind=customer&token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

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

  const brandColor = getBrandColor(order);
  const businessName = getBusinessName(order);
  const sellerPhone = getPrimaryContactNumber(order.profile);
  const status = order.status as OrderStatus;

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
            <div className="brand-subtitle">Customer tracking link</div>
          </div>
        </div>

        <div className="hero-grid">
          <div>
            <div className={`status-pill status-${status}`}>{getStatusLabel(status)}</div>
            <h1 className="hero-title">{order.item}</h1>
            <p className="hero-copy">
              Order #{order.order_number ?? order.id.slice(0, 6).toUpperCase()}
            </p>
          </div>
          <div className="hero-badge">
            {status === "delivered" && order.delivered_at
              ? `Delivered ${formatDateTime(order.delivered_at)}`
              : "Live delivery view"}
          </div>
        </div>
      </section>

      <section className="panel section-gap">
        <div className="section-head">
          <h2>Order details</h2>
        </div>
        <dl className="details-list">
          <div className="detail-row">
            <dt>Item</dt>
            <dd>{order.item}</dd>
          </div>
          {order.delivery_fee != null ? (
            <div className="detail-row">
              <dt>Delivery fee</dt>
              <dd className="mono">{formatAmount(order.delivery_fee)}</dd>
            </div>
          ) : null}
          {order.delivery_address ? (
            <div className="detail-row">
              <dt>Delivery address</dt>
              <dd>{order.delivery_address}</dd>
            </div>
          ) : null}
          {order.city ? (
            <div className="detail-row">
              <dt>City</dt>
              <dd>{order.city}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <Timeline events={order.events} />

      <section className="foot-actions">
        {sellerPhone ? (
          <a className="primary-button" href={`tel:${sellerPhone}`}>
            Contact seller
          </a>
        ) : null}
        <Link className="secondary-link" href={homeUrl}>
          Powered by Trackshpr
        </Link>
        {error ? <p className="muted center-text">{error}</p> : null}
      </section>
    </main>
  );
}
