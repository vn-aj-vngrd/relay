import { ThemeSelector } from "./theme-toggle";

export function PublicThemeFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t border-line px-4 py-6 sm:px-8 ${className}`}>
      <div className="mx-auto flex w-full max-w-[1180px] justify-center sm:justify-end">
        <ThemeSelector />
      </div>
    </footer>
  );
}
