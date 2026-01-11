import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FiveDollarRide - Blockchain Income Platform",
  description: "Earn passive income with 4 automated streams on BSC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
