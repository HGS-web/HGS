import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-black mb-4">404</h1>
        <p className="text-xl text-black/60 mb-8">
          Page not found
        </p>
        <Link
          href="/en"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black/5 text-black rounded-full hover:bg-black/10 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
