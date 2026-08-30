import { Skeleton } from "@/components/shared/skeleton";

export default function EditProfileLoading() {
  return (
    <div role="status" aria-label="Loading profile editor" aria-busy="true" className="mx-auto w-full max-w-3xl">
      <header className="flex items-center gap-2 border-b border-line pb-5">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-8 w-36" />
      </header>
      <div className="mt-6 flex items-center gap-4 pb-6">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </div>
      <div className="border-y border-line py-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-5">
          <Skeleton className="h-4 w-64 max-w-[60%]" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
