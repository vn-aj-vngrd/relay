import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";

import {
  getHelpArticle,
  type HelpArticle,
  helpCategories,
  helpOwner,
  helpReviewedAt,
} from "./content";
import { HelpSupportLinks } from "./help-support-links";

export function HelpArticleContent({ article }: { article: HelpArticle }) {
  const category = helpCategories.find((item) => item.id === article.category);
  return (
    <article className="mx-auto w-full max-w-6xl">
      <nav
        aria-label="Breadcrumb"
        className="mb-3 text-sm leading-6 text-muted"
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link
              href="/help"
              className="inline-flex min-h-9 items-center hover:text-ink"
            >
              Help Center
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/help?category=${article.category}`}
              className="inline-flex min-h-9 items-center hover:text-ink"
            >
              {category?.title}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {article.title}
          </li>
        </ol>
      </nav>
      <header className="max-w-[70ch]">
        <h1 className="app-title text-balance">{article.title}</h1>
        <p className="mt-2 text-base leading-7 text-muted">{article.summary}</p>
        <p className="mt-2 text-sm leading-6">
          <span className="font-semibold">For:</span> {article.audience}
        </p>
        <details
          id="before-you-start"
          className="mt-3 scroll-mt-8 border-y border-line"
        >
          <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold">
            Before you start: requirements and access
          </summary>
          <ul className="mb-3 flex list-disc flex-col gap-2 pl-5 text-base leading-7">
            {article.prerequisites.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </details>
      </header>

      <div className="grid gap-6 py-5 xl:grid-cols-[minmax(0,1fr)_250px] xl:gap-8">
        <section
          id="steps"
          aria-labelledby="steps-title"
          className="min-w-0 max-w-[70ch] scroll-mt-8"
        >
          <h2 id="steps-title" className="sr-only">
            Steps
          </h2>
          <ol className="flex list-decimal flex-col gap-4 pl-5 text-base leading-7 marker:font-semibold marker:text-primary">
            {article.steps.map((text, index) => (
              <li key={text} className="pl-1">
                {text}
                {article.figures
                  ?.filter((figure) => figure.afterStep === index + 1)
                  .map((figure) => (
                    <figure key={figure.src} className="my-4">
                      <a
                        href={figure.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-line"
                        aria-label={`Open full-size screenshot: ${figure.alt}`}
                      >
                        <Image
                          src={figure.src}
                          alt={figure.alt}
                          width={figure.width}
                          height={figure.height}
                          sizes="(max-width: 768px) 90vw, 680px"
                          className="h-auto w-full rounded-lg"
                        />
                      </a>
                      <figcaption className="mt-2 text-sm leading-6 text-muted">
                        {figure.caption} Select the image to read it full-size.
                      </figcaption>
                    </figure>
                  ))}
              </li>
            ))}
          </ol>
          {article.action ? (
            <ButtonLink
              href={article.action.href}
              className="mt-5"
              variant="secondary"
            >
              {article.action.label}
            </ButtonLink>
          ) : null}
        </section>

        <aside aria-label="Article reference" className="min-w-0">
          <details id="outcome" className="scroll-mt-8 border-y border-line">
            <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold">
              Expected outcome
            </summary>
            <p className="pb-3 text-base leading-7">{article.outcome}</p>
          </details>
          <details
            id="troubleshooting"
            className="scroll-mt-8 border-b border-line"
          >
            <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold">
              Troubleshooting
            </summary>
            <ul className="mb-3 flex list-disc flex-col gap-2 pl-5 text-base leading-7">
              {article.troubleshooting.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </details>
          <section id="related" className="scroll-mt-8 pt-4">
            <h2 className="text-base font-semibold">Related articles</h2>
            <ul className="mt-1">
              {article.related.map((slug) => {
                const related = getHelpArticle(slug);
                return related ? (
                  <li key={slug}>
                    <Link
                      href={`/help/${slug}`}
                      prefetch={false}
                      className="flex min-h-11 items-center py-2 text-sm leading-6 text-primary hover:underline"
                    >
                      {related.title}
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          </section>
          <HelpSupportLinks />
          <details className="mt-2">
            <summary className="min-h-11 cursor-pointer py-2 text-sm text-muted">
              About this article
            </summary>
            <p className="text-sm leading-6 text-muted">
              Maintained by {helpOwner}. Source-reviewed{" "}
              <time dateTime={helpReviewedAt}>{helpReviewedAt}</time>.
            </p>
          </details>
        </aside>
      </div>
    </article>
  );
}
