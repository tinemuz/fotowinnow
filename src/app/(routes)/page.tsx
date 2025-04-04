import {SignedOut} from "@clerk/nextjs";
import {auth} from "@clerk/nextjs/server";
import Nav from "@/components/ui/Nav";
import {redirect} from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {/* SignedIn component not needed since signed-in users are redirected */}
      
      <SignedOut>
        <Nav/>
        <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-6">Welcome to Fotowinnow</h1>
          <p className="text-lg mb-8">
            The simple way to add custom watermarks to your photos
          </p>
          
          <div className="bg-gray-100 p-8 rounded-lg mb-8">
            <div className="aspect-square max-w-sm mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              <p className="text-gray-500">Image Preview</p>
            </div>
            <p className="text-sm text-gray-600">
              Sign in to upload and watermark your images
            </p>
          </div>
        </div>
      </SignedOut>
    </main>
  );
} 