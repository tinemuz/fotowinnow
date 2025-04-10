"use client"

import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { ChevronRight, PlusCircle } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { NewAlbumModal } from "~/components/new-album-modal";
import { fetchAlbums } from "~/lib/api";
import type { Album } from "~/lib/types";

interface NavBarProps {
  albumTitle?: string
}

export function NavBar({ albumTitle }: NavBarProps) {

  return (
    <div className="container flex h-14 w-full items-center justify-between">
      <span className="font-bold text-lg">fotowinnow</span>
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
      <>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </>
    </div>
  )
} 