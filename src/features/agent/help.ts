import {
  getHelpArticle,
  helpArticles,
  helpReviewedAt,
  searchHelpArticles,
} from "@/features/help/content";

export function searchAgentHelp(query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const titleMatches = (title: string) =>
    terms.length > 0 &&
    terms.every((term) => title.toLowerCase().includes(term));
  const relevance = ({ slug, title }: { slug: string; title: string }) => {
    const slugWords = slug.split("-");
    const matchesSlug =
      terms.length > 0 && terms.every((term) => slugWords.includes(term));
    return Number(matchesSlug) * 2 + Number(titleMatches(title));
  };
  const matches = searchHelpArticles(query).sort(
    (left, right) => relevance(right) - relevance(left)
  );
  return matches.slice(0, 8).map(({ slug, title, summary }, index) => ({
    slug,
    title,
    summary,
    href: `/help/${slug}`,
    // One bounded guide avoids a second model round trip for a matching hit.
    ...(index === 0 && (matches.length === 1 || relevance({ slug, title }) > 0)
      ? { article: readAgentHelp(slug) }
      : {}),
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
