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
    <header className="game-page-intro flex shrink-0 items-start justify-between gap-3 pb-3 sm:pb-5 sm:pt-1">
      <div className="min-w-0 flex-1">
        <h1 className="game-page-intro-title app-title">{title}</h1>
        <p className="game-page-intro-description mt-1.5 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action}
    </header>
  );
}
