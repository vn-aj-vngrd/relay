import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export function AdminPageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <ShieldCheck aria-hidden size={17} weight="fill" />
          Production operations
        </div>
        <h1 className="app-title">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}
