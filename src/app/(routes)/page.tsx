import SingleImageUploader from "@/components/forms/SingleImageUploader";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="w-full max-w-2xl">
          <SingleImageUploader />
        </div>
      </div>
    </main>
  );
} 