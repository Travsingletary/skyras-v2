import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marcus · SkyRas PM",
  description: "AI workflow builder for content creators",
};

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
