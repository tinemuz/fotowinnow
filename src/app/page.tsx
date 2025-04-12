"use client"

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { NavBar } from "~/components/nav-bar"

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/albums")
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <>
      <NavBar />
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight">
            Modern Photo Proofing and Delivery
          </h1>
          <p className="text-xl text-stone-600 max-w-2xl">
            Streamline your photography workflow with our intuitive platform. Share, proof, and deliver photos to your clients with ease.
          </p>
          <div className="flex gap-4">
            <SignUpButton>
              <button className="bg-stone-900 text-white px-6 py-3 rounded-full font-medium hover:bg-stone-800 transition-colors">
                Get Started
              </button>
            </SignUpButton>
            <SignInButton>
              <button className="bg-stone-100 text-stone-900 px-6 py-3 rounded-full font-medium hover:bg-stone-200 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    </>
  )
}

