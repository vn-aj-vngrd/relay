export default function AppLoading() {
  return (
    <div aria-label="Loading page" aria-busy="true" className="animate-pulse">
      <div className="h-4 w-28 rounded bg-surface-strong" />
      <div className="mt-3 h-9 w-64 max-w-[75%] rounded-lg bg-surface-strong" />
      <div className="mt-10 overflow-hidden rounded-2xl bg-court/90">
        <div className="h-52 p-6">
          <div className="h-3 w-24 rounded bg-white/15" />
          <div className="mt-12 h-8 w-2/3 rounded bg-white/15" />
          <div className="mt-3 h-4 w-1/2 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-10 border-y border-line py-5">
        <div className="h-4 w-36 rounded bg-surface-strong" />
        <div className="mt-5 h-14 rounded-lg bg-surface-strong/70" />
        <div className="mt-3 h-14 rounded-lg bg-surface-strong/70" />
      </div>
    </div>
  );
}
