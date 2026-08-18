import Image from "next/image";

type ProductShotProps = {
  src: string;
  alt: string;
  caption: string;
  priority?: boolean;
  mobileFocus?: "left" | "center" | "right";
  width: number;
  height: number;
};

export function ProductShot({ src, alt, caption, priority = false, width, height }: ProductShotProps) {
  return <figure>
    <div className="overflow-hidden rounded-xl border border-[#d9d9d4] bg-white">
      <Image src={src} alt={alt} width={width} height={height} priority={priority} unoptimized sizes="(min-width: 1180px) 1120px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)" className="block h-auto w-full" />
    </div>
    <figcaption className="mt-3 flex items-center gap-2 text-xs text-[#6b6b70]"><span className="h-1.5 w-1.5 rounded-full bg-[#b7d62e]" />{caption} · actual Relay product</figcaption>
  </figure>;
}

export function HeroProductShot() {
  return <figure>
    <div className="overflow-hidden rounded-xl border border-[#d9d9d4] bg-white">
      <picture><source media="(max-width: 639px)" srcSet="/images/product/invite-mobile.webp" /><Image src="/images/product/overview.webp" alt="Relay host Overview with game readiness, confirmed booking, session plan, and player roster" width={2880} height={1800} priority unoptimized sizes="(min-width: 1180px) 1180px, calc(100vw - 40px)" className="block h-auto w-full" /></picture>
    </div>
    <figcaption className="mt-3 flex items-center justify-between gap-4 text-xs text-[#6b6b70]"><span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#b7d62e]" />Actual Relay session</span><span>Host workspace · shared link on mobile</span></figcaption>
  </figure>;
}

export function InviteProductShot() {
  return <figure>
    <div className="overflow-hidden rounded-xl border border-[#d9d9d4] bg-white">
      <picture><source media="(max-width: 639px)" srcSet="/images/product/invite-mobile.webp" /><Image src="/images/product/invite-desktop.webp" alt="Public Relay invitation using the same Overview, Players, Play, Chat, and Payments structure with no-account guest RSVP" width={2880} height={1800} unoptimized sizes="(min-width: 1180px) 760px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)" className="block h-auto w-full" /></picture>
    </div>
    <figcaption className="mt-3 flex items-center gap-2 text-xs text-[#6b6b70]"><span className="h-1.5 w-1.5 rounded-full bg-[#b7d62e]" />The same shared link, with or without an account</figcaption>
  </figure>;
}
