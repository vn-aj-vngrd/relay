import { Skeleton } from "@/components/shared/skeleton";

export default function OnboardingLoading() {
  return (
    <main id="main-content" className="min-h-screen bg-canvas">
      <header className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </header>
      <section className="mx-auto max-w-[720px] px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
        <div className="flex gap-2">
          <Skeleton className="h-1.5 w-10" />
          <Skeleton className="h-1.5 w-10" />
          <Skeleton className="h-1.5 w-10" />
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
          <div>
            <Skeleton className="h-6 w-6" />
            <Skeleton className="mt-5 h-8 w-44" />
            <Skeleton className="mt-3 h-16 w-full" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-end border-t border-line pt-5">
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
