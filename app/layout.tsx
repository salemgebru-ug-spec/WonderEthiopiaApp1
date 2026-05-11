import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Optimized font loading
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PortalWrapper from "@/components/layout/PortalWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WondarEthiopia — Discover the Wonders of Ethiopia",
  description:
    "Your gateway to exploring Ethiopia's breathtaking landscapes, ancient heritage, and vibrant culture. Find verified hotels, tour operators, and restaurants.",
  keywords: [
    "Ethiopia",
    "tourism",
    "Lalibela",
    "Simien Mountains",
    "Gondar",
    "travel",
    "African travel",
  ],
  openGraph: {
    title: "WondarEthiopia — Discover the Wonders of Ethiopia",
    description:
      "Your gateway to exploring Ethiopia's breathtaking landscapes, ancient heritage, and vibrant culture.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#050505" />
      </head>
      <body className={`${inter.className} antialiased font-sans`}
      suppressHydrationWarning={true}
      >
        
        <SessionProvider>
          <PortalWrapper>
            {children}
          </PortalWrapper>
          <ToastContainer
            theme="dark"
            position="bottom-right"
            closeButton={false}
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            pauseOnHover
          />
        </SessionProvider>
      </body>
    </html>
  );
}
