import "./globals.css";
import {ClerkProvider, UserButton, SignInButton, SignUpButton} from '@clerk/nextjs'
import {type Metadata} from "next";
import {Inter} from "next/font/google";
import Nav from "@/components/ui/Nav";
import { headers } from "next/headers";
import { use } from "react";

export const metadata: Metadata = {
    title: "Fotowinnow",
    description: "Seamless photography hand-off",
    icons: [{rel: "icon", url: "/favicon.ico"}],
};

const inter = Inter({
    subsets: ["latin"],
    variable: '--font-inter',
});

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const headersList = use(headers());
    const host = headersList.get("host") || "";
    const isAppSubdomain = host.startsWith("app.");

    return (
        <ClerkProvider>
            <html lang="en" >
            <body className={`${inter.variable}`}>
            <Nav/>
            <header className="flex justify-end items-center p-4 gap-4 mt-14">
                {!isAppSubdomain && (
                    <>
                        <SignInButton/>
                        <SignUpButton/>
                    </>
                )}
                {isAppSubdomain && <UserButton />}
            </header>
            {children}
            </body>
            </html>
        </ClerkProvider>
    );
}
