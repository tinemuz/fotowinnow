"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import { useClerk } from "@clerk/nextjs"
import { Button } from "~/components/ui/button"

interface NavBarProps {
  albumTitle?: string
}

export function NavBar({ albumTitle }: NavBarProps) {
  const router = useRouter()
  const _pathname = usePathname()
  const { signOut } = useClerk()

  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/albums" className="font-semibold">
          {albumTitle ? (
            <span className="text-muted-foreground">
              FotoWinnow / <span className="text-foreground">{albumTitle}</span>
            </span>
          ) : (
            "FotoWinnow"
          )}
        </Link>

        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          Sign Out
        </Button>
      </div>
    </header>
  )
} 