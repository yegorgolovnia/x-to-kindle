import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistPixel = localFont({
  src: "./fonts/GeistPixel-Regular.woff2",
  variable: "--font-geist-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "X to Kindle",
  description: "Send X (Twitter) Articles directly to your Kindle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistPixel.variable} font-pixel antialiased bg-black text-white selection:bg-white selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
