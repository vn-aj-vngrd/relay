const colors = ["bg-primary", "bg-[oklch(.42_.09_245)]", "bg-[oklch(.55_.13_32)]", "bg-[oklch(.48_.11_285)]", "bg-[oklch(.47_.10_185)]"];

export function Avatar({ name, index = 0, size = "md" }: { name: string; index?: number; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return <span aria-label={name} title={name} className={`${dimensions} ${colors[index % colors.length]} inline-flex shrink-0 items-center justify-center rounded-full border-2 border-canvas font-bold text-white`}>{name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>;
}

export function AvatarStack({ names, total }: { names: string[]; total?: number }) {
  return <div className="flex items-center" aria-label={`${total ?? names.length} players`}>
    {names.slice(0, 5).map((name, index) => <span className="-ml-2 first:ml-0" key={name}><Avatar name={name} index={index} /></span>)}
    {(total ?? names.length) > names.length ? <span className="-ml-2 inline-flex h-10 min-w-10 items-center justify-center rounded-full border-2 border-canvas bg-surface-strong px-2 text-xs font-bold">+{(total ?? names.length) - names.length}</span> : null}
  </div>;
}
