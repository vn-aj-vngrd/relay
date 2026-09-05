import Link from "next/link";

import { Button } from "@/components/ui/button";

import {
  getHelpArticle,
  helpCategories,
  legacyHelpLinks,
  searchHelpArticles,
} from "./content";
import { HelpSupportLinks } from "./help-support-links";

export function HelpCenterContent({
  query = "",
  category,
}: {
  query?: string;
  category?: string;
}) {
  const selectedCategory = helpCategories.find((item) => item.id === category);
  const articles = searchHelpArticles(query, selectedCategory?.id);
  const isSearching = Boolean(query.trim());
  const isFiltered = isSearching || Boolean(selectedCategory);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-4 border-b border-line pb-5 xl:flex-row xl:items-end xl:justify-between">
        <h1 className="app-title">Help Center</h1>
        <form
          noValidate
          action="/help"
          method="get"
          role="search"
          className="w-full xl:max-w-xl"
        >
          <label htmlFor="help-search" className="sr-only">
            Search help articles
          </label>
          <div className="flex gap-2">
            <input
              id="help-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search help articles…"
              className="h-12 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-base text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            <Button type="submit">Search</Button>
          </div>
          {selectedCategory ? (
            <input type="hidden" name="category" value={selectedCategory.id} />
          ) : null}
        </form>
      </header>

      <div className="grid gap-6 py-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0">
          {isFiltered ? (
            <nav aria-label="Help topics">
              <Link
                href="/help"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
              >
                All topics
              </Link>
              <details className="lg:hidden">
                <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">
                  Change topic
                </summary>
                <TopicLinks selected={selectedCategory?.id} />
              </details>
              <div className="hidden lg:block">
                <TopicLinks selected={selectedCategory?.id} />
              </div>
            </nav>
          ) : (
            <section aria-labelledby="start-here">
              <h2 id="start-here" className="text-base font-semibold">
                New to Relay?
              </h2>
              <ul className="mt-1 grid sm:grid-cols-2 lg:grid-cols-1">
                {[
                  ["player-start", "Join your first game"],
                  ["host-start", "Host your first game"],
                  ["illustrated-game-cycle", "Illustrated walkthrough"],
                  ["quick-play", "Quick Play on one device"],
                ].map(([slug, title]) => (
                  <li key={slug}>
                    <Link
                      href={`/help/${slug}`}
                      prefetch={false}
                      className="flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
                    >
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <section aria-labelledby="help-results" className="min-w-0">
          <h2 id="help-results" className="break-words text-lg font-semibold">
            {isSearching
              ? `Results for “${query.trim()}”`
              : (selectedCategory?.title ?? "Browse topics")}
          </h2>
          {isFiltered ? (
            <>
              <p className="mt-1 text-sm leading-6 text-muted">
                {articles.length}{" "}
                {articles.length === 1 ? "article" : "articles"}
                {isSearching && selectedCategory
                  ? ` in ${selectedCategory.title}`
                  : ""}
              </p>
              {articles.length ? (
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {articles.map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={`/help/${article.slug}`}
                        prefetch={false}
                        className="block py-3 hover:text-primary"
                      >
                        <h3 className="text-base font-semibold leading-6">
                          {article.title}
                        </h3>
                        {isSearching ? (
                          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                            {article.summary}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
                  No articles match. Try fewer words or browse all topics.
                </p>
              )}
              <Link
                href="/help"
                className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
              >
                Clear search and filters
              </Link>
            </>
          ) : (
            <nav aria-label="Help topics" className="mt-3">
              <ul className="divide-y divide-line border-y border-line">
                {helpCategories.map((item) => (
                  <li key={item.id} id={`topic-${item.id}`}>
                    <Link
                      href={`/help?category=${item.id}`}
                      prefetch={false}
                      className="block py-3 hover:text-primary"
                    >
                      <h3 className="text-base font-semibold leading-6">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {item.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </section>
      </div>

      <HelpSupportLinks />
      <details className="border-t border-line">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-muted">
          Previous manual bookmarks
        </summary>
        <ul className="grid gap-x-6 sm:grid-cols-2">
          {legacyHelpLinks.map((link) => (
            <li key={link.id} id={link.id} className="scroll-mt-8">
              <Link
                href={`/help/${link.slug}`}
                prefetch={false}
                className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
              >
                {getHelpArticle(link.slug)?.title}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function TopicLinks({ selected }: { selected?: string }) {
  return (
    <ul>
      {helpCategories.map((item) => (
        <li key={item.id}>
          <Link
            href={`/help?category=${item.id}`}
            prefetch={false}
            aria-current={selected === item.id ? "page" : undefined}
            className="flex min-h-11 items-center text-sm leading-5 text-muted hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-primary"
          >
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
