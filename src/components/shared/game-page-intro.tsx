export function GamePageIntro({
  title,
  action,
  showTitle = false,
}: {
  title: string;
  action?: React.ReactNode;
  showTitle?: boolean;
}) {
  if (!showTitle) {
    return (
      <>
        <h1 className="sr-only">{title}</h1>
        {action ? (
          <div className="game-page-intro flex shrink-0 justify-end pb-3 sm:pb-5">
            {action}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <header className="game-page-intro flex shrink-0 items-start justify-between gap-3 pb-3 sm:pb-5 sm:pt-1">
      <div className="min-w-0 flex-1">
        <h1 className="game-page-intro-title app-title">{title}</h1>
      </div>
      {action}
    </header>
  );
}
