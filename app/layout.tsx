import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit, Literata, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gradee - Your Best Environment for Academic Excellence",
  description: "Crafting the world's most effective academic environments through technology, mentorship, and ergonomic design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${literata.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
