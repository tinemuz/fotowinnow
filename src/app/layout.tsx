import "./globals.css";
import {ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton,} from '@clerk/nextjs'
import {type Metadata} from "next";
import {Inter} from "next/font/google";
import Nav from "@/components/ui/Nav";

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
            <html lang="en" >
            <body className={`${inter.variable}`}>
            <Nav/>
            <header className="flex justify-end items-center p-4 gap-4 mt-14">
                <SignedOut>
                    <SignInButton/>
                    <SignUpButton/>
                </SignedOut>
                <SignedIn>
                    <UserButton/>
                </SignedIn>
            </header>
            {children}

            </body>
            </html>
        </ClerkProvider>

    );
}
