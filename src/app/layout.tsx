import type { Metadata } from "next";
import { GeistPixelCircle } from "geist/font/pixel";
import "./globals.css";

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
      <body className={`${GeistPixelCircle.variable} font-pixel antialiased bg-black text-white selection:bg-white selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
