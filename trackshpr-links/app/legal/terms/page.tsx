import Link from "next/link";
import { termsSections } from "@/lib/legal";

export default function TermsPage() {
  return (
    <main className="legal-shell">
      <header className="legal-header">
        <Link href="/">Trackshpr</Link>
        <span>Terms of Service</span>
      </header>
      <section className="legal-hero">
        <p className="landing-kicker">Last updated</p>
        <h1>The rules of the road.</h1>
        <p className="landing-copy">
          Short, plain-language terms for using Trackshpr delivery links and
          related services.
        </p>
      </section>
      <section className="legal-stack">
        {termsSections.map((section) => (
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
