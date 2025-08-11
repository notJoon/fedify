import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fedify Next.js App Router Example",
  description: "A demo of Fedify with Next.js App Router",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
