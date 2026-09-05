import { ButtonLink } from "@/components/ui/button";
import { HelpSupportLinks } from "@/features/help/help-support-links";

export default function HelpArticleNotFound() {
  return (
    <div>
      <h1 className="app-title">Help article not found</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
        This article address may be incomplete or outdated. Search the Help
        Center or browse a topic to find the current guide.
      </p>
      <ButtonLink href="/help" className="my-6">
        Browse Help Center
      </ButtonLink>
      <HelpSupportLinks />
    </div>
  );
}
