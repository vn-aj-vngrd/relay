import {
  ArrowRight,
  CheckCircle,
  EnvelopeSimple,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";

export function EmailSentState({
  label,
  title,
  description,
  primary,
  secondary,
}: {
  label: ReactNode;
  title: string;
  description: string;
  primary: { href: string; label: string };
  secondary: { prefix: string; href: string; label: string };
}) {
  return (
    <section
      aria-labelledby="email-sent-title"
      className="w-full max-w-[410px] text-center"
    >
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">
        <EnvelopeSimple aria-hidden size={30} weight="duotone" />
      </div>
      <div className="mt-6 inline-flex max-w-full items-start gap-1.5 rounded-full bg-surface-strong px-3 py-1.5 text-left text-xs font-semibold leading-5 text-muted ring-1 ring-line">
        <CheckCircle
          aria-hidden
          size={16}
          weight="fill"
          className="mt-0.5 shrink-0 text-success"
        />
        <span>{label}</span>
      </div>
      <h1
        id="email-sent-title"
        className="mt-5 text-[1.75rem] font-[650] tracking-[-0.025em]"
      >
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-6 text-muted">
        {description}
      </p>
      <ButtonLink href={primary.href} className="mt-8 h-12 w-full text-[15px]">
        {primary.label}
        <ArrowRight aria-hidden size={17} weight="bold" />
      </ButtonLink>
      <p className="mt-5 text-sm text-muted">
        {secondary.prefix}{" "}
        <ButtonLink
          href={secondary.href}
          variant="quiet"
          className="min-h-0 border-0 p-0 align-baseline font-semibold text-ink hover:bg-transparent hover:underline"
        >
          {secondary.label}
        </ButtonLink>
      </p>
    </section>
  );
}
