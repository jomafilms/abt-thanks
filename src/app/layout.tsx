import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";

export const metadata: Metadata = {
  title: "Above the Trees - Thank You Trail",
  description: "A virtual trail of gratitude",
  icons: {
    icon: '/joma-jf-favicon.ico',
    apple: '/joma-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Above the Trees",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} ${GeistMono.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
