import {
  getHelpArticle,
  helpArticles,
  helpReviewedAt,
  searchHelpArticles,
} from "@/features/help/content";

export function searchAgentHelp(query: string) {
  return searchHelpArticles(query)
    .slice(0, 8)
    .map(({ slug, title, summary }) => ({
      slug,
      title,
      summary,
      href: `/help/${slug}`,
    }));
}
export function readAgentHelp(slug: string) {
  const article = getHelpArticle(slug);
  if (!article) return { unavailable: true };
  const { title, summary, prerequisites, steps, outcome, troubleshooting } =
    article;
  return {
    title,
    summary,
    prerequisites,
    steps,
    outcome,
    troubleshooting,
    href: `/help/${slug}`,
    reviewedAt: helpReviewedAt,
  };
}
export function agentHelpIndex() {
  return helpArticles.map(({ slug, title }) => ({ slug, title }));
}
