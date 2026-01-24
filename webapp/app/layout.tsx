import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GREAT INVESTOR CLUB - GIC CLUB",
  description: "Join GREAT INVESTOR CLUB (GIC CLUB) and earn passive income through 4 powerful streams on BSC Mainnet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
