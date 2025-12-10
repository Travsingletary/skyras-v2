import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marcus · SkyRas PM",
  description: "AI workflow builder for content creators",
};

// Force dynamic rendering for all pages
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
