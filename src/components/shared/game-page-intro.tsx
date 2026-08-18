export function GamePageIntro({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-3 pb-5 pt-2">
      <div className="min-w-0 flex-1">
        <h1 className="app-title">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action}
    </header>
  );
}
