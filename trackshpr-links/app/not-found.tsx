import Link from "next/link";

export default function NotFound() {
  return (
    <main className="landing-shell">
      <section className="landing-card">
        <p className="landing-kicker">Trackshpr</p>
        <h1>This link is not valid.</h1>
        <p className="landing-copy">
          It may have expired, been deleted, or been copied incorrectly.
        </p>
        <div className="landing-links">
          <Link href="/">Back home</Link>
        </div>
      </section>
    </main>
  );
}
