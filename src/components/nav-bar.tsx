"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"

interface NavBarProps {
  albumTitle?: string
}

export function NavBar({ albumTitle }: NavBarProps) {
  const router = useRouter()
  const _pathname = usePathname()

  return (
    <div className="container flex h-14 w-full items-center justify-between">
      <div className="flex items-center justify-between gap-1 text-sm text-muted-foreground">
        <Link href="/" className="text-foreground hover:text-foreground/80">
          Albums
        </Link>
        {albumTitle && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{albumTitle}</span>
          </>
        )}
      </div>
      <div>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  )
} 