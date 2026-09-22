import type { Metadata } from "next";
import { Boogaloo, Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";

const uiFont = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Self-hosted alternatives to the reference's Etna Sans Serif and Marykate fonts.
const displayFont = Boogaloo({ variable: "--font-boogaloo", weight: "400", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "TeamFit | Smart Student Team Formation",
  description:
    "TeamFit helps university students find suitable project teammates based on skills, roles, and availability.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${uiFont.variable} ${geistMono.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
