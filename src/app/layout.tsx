import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import Footer from "../components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Divine X PariMatch",
  description: "Experience the future of photo transformation. Upload your image and watch as our advanced AI creates stunning face-swap results in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical fonts to prevent layout shifts */}
        <link
          rel="preload"
          href="/fonts/Pari-Match Regular/Web Fonts/c03740f2ffb689fef4bbb9c26116c4c1.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Preconnect to optimize font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {/* Preload critical background images to prevent layout shifts */}
        <link rel="preload" as="image" href="/images/landing/backgrounds/section1.avif" />
        <link rel="preload" as="image" href="/images/landing/backgrounds/mobile1.avif" />
        {/* Critical CSS hint */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Cache control for dynamic content */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
