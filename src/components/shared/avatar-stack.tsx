import Image from "next/image";

const colors = ["bg-primary", "bg-[oklch(.42_.09_245)]", "bg-[oklch(.55_.13_32)]", "bg-[oklch(.48_.11_285)]", "bg-[oklch(.47_.10_185)]"];

export function Avatar({ name, imageUrl, index = 0, size = "md" }: { name: string; imageUrl?: string; index?: number; size?: "sm" | "md" | "lg" | "xl" }) {
  const dimensions = size === "xl" ? "h-20 w-20 text-xl" : size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const pixels = size === "xl" ? 80 : size === "lg" ? 48 : size === "sm" ? 32 : 40;
  return <span role="img" aria-label={name} title={name} className={`${dimensions} ${colors[index % colors.length]} relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-canvas font-bold text-white`}>{imageUrl ? <Image src={imageUrl} alt="" aria-hidden width={pixels} height={pixels} sizes={`${pixels}px`} unoptimized={imageUrl.startsWith("blob:")} className="h-full w-full object-cover" /> : name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>;
}

export function AvatarStack({ names, imageUrls = [], total }: { names: string[]; imageUrls?: Array<string | undefined>; total?: number }) {
  return <div className="flex items-center" aria-label={`${total ?? names.length} players`}>
    {names.slice(0, 5).map((name, index) => <span className="-ml-2 first:ml-0" key={`${name}-${index}`}><Avatar name={name} imageUrl={imageUrls[index]} index={index} /></span>)}
    {(total ?? names.length) > names.length ? <span className="-ml-2 inline-flex h-10 min-w-10 items-center justify-center rounded-full border-2 border-canvas bg-surface-strong px-2 text-xs font-bold">+{(total ?? names.length) - names.length}</span> : null}
  </div>;
}
