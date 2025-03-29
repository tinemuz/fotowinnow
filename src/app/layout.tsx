import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import Nav from "./_components/Nav";

export const metadata: Metadata = {
  title: "Fotowinnow",
  description: "Add watermarks to your images",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body>
        <TRPCReactProvider>
          <Nav />
          <main className="pt-16">
            {children}
          </main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
