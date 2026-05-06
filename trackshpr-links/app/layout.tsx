import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trackshpr Links",
  description: "Customer tracking and rider delivery links for Trackshpr.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
