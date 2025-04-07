"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronRight, User } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

interface NavBarProps {
  albumTitle?: string
}

export function NavBar({ albumTitle }: NavBarProps) {
  const params = useParams()

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