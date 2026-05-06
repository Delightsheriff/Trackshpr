import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="landing-card">
        <p className="landing-kicker">Trackshpr public links</p>
        <h1>Small, stable delivery pages for riders and customers.</h1>
        <p className="landing-copy">
          This repo is intentionally narrow: public delivery views, rider action
          flows, and legal pages. Seller workflows stay in the mobile app.
        </p>
        <div className="landing-links">
          <Link href="/legal/privacy">Privacy Policy</Link>
          <Link href="/legal/terms">Terms of Service</Link>
        </div>
      </section>
    </main>
  );
}
