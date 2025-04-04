import "./globals.css";
import {ClerkProvider, SignedOut, SignInButton, SignUpButton,} from '@clerk/nextjs'
import {type Metadata} from "next";
import {Inter} from "next/font/google";

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
    return (
        <ClerkProvider>
            <html lang="en">
            <body className={`${inter.variable}`}>
            <SignedOut>
                <header className="flex justify-end items-center p-4 gap-4 mt-14">
                    <SignInButton/>
                    <SignUpButton/>
                </header>
            </SignedOut>

            {children}

            </body>
            </html>
        </ClerkProvider>

    );
}
