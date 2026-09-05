import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getHelpArticle } from "@/features/help/content";
import { HelpArticleContent } from "@/features/help/help-article-content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getHelpArticle((await params).slug);
  if (!article) return { title: "Help article not found" };
  return {
    title: `${article.title} | Help Center`,
    description: article.summary,
    alternates: { canonical: `/help/${article.slug}` },
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const article = getHelpArticle((await params).slug);
  if (!article) notFound();
  return <HelpArticleContent article={article} />;
}
