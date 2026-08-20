import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Portfolio",
  description: "A portfolio of software and game projects.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
