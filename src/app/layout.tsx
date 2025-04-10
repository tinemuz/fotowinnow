import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: "Fotowinnow",
  description: "A modern photo proofing and delivery application designed for photographers",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable}`}>
        <body className={"flex w-full flex-col items-center px-4"}>
          {children}
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
