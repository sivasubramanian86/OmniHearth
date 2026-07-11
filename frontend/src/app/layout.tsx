import type { Metadata } from "next";
import { Quicksand, Nunito_Sans } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "OmniHearth - Autonomous Household Operating System",
  description: "A warm, intelligent multi-agent household orchestration ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${quicksand.variable} ${nunitoSans.variable} h-full antialiased`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
