"use client";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[70vh] max-w-md flex-col items-start justify-center px-4"
    >
      <p className="text-sm font-semibold text-danger">
        Couldn’t load this page
      </p>
      <h1 className="mt-2 text-2xl font-bold">The game plan is still safe.</h1>
      <p className="mt-3 leading-6 text-muted">
        Check your connection, then try loading it again.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </main>
  );
}
