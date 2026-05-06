"use client";

import { formatDateTime, mapTimelineLabel } from "@/lib/format";
import type { OrderEvent } from "@/lib/types";

export function Timeline({ events }: { events: OrderEvent[] }) {
  return (
    <section className="panel section-gap">
      <div className="section-head">
        <h2>Timeline</h2>
      </div>
      <div className="timeline">
        {events.length === 0 ? (
          <p className="muted">No updates yet.</p>
        ) : null}
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          const isFailure = event.status === "failed";

          return (
            <div className="timeline-row" key={event.id || `${event.status}-${index}`}>
              <div className="timeline-rail">
                <span className={`timeline-dot ${isFailure ? "error" : "success"}`} />
                {!isLast ? <span className="timeline-line" /> : null}
              </div>
              <div className="timeline-copy">
                <div className="timeline-title">{mapTimelineLabel(event.status)}</div>
                {event.note ? <div className="timeline-note">{event.note}</div> : null}
                <div className="timeline-time">{formatDateTime(event.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
