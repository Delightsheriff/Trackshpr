import Link from "next/link";
import { privacySections } from "@/lib/legal";

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <header className="legal-header">
        <Link href="/">Trackshpr</Link>
        <span>Privacy Policy</span>
      </header>
      <section className="legal-hero">
        <p className="landing-kicker">Last updated</p>
        <h1>Your data, handled carefully.</h1>
        <p className="landing-copy">
          This page explains what Trackshpr collects, why we collect it, and
          the choices you have around your data.
        </p>
      </section>
      <section className="legal-stack">
        {privacySections.map((section) => (
          <article className="panel" key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}
