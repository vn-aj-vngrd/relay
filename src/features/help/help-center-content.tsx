import {
  ArrowRight,
  Clock,
  Info,
  MagnifyingGlass,
} from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";
import type { CourtListing } from "@/features/venues/directory";

import { faqSections, helpGuides, helpSectionId, playModes } from "./content";
import { HelpProductPreview } from "./help-product-preview";

function matchesQuery(parts: readonly string[], query: string) {
  return !query || parts.join(" ").toLowerCase().includes(query);
}

export function HelpCenterContent({
  courts,
  query: rawQuery = "",
}: {
  courts: CourtListing[];
  query?: string;
}) {
  const query = rawQuery.trim().toLowerCase();
  const visibleGuides = helpGuides.filter((guide) =>
    matchesQuery(
      [
        guide.title,
        guide.summary,
        ...guide.steps.flatMap((step) => [step.title, step.detail]),
        ...(guide.notes ?? []),
      ],
      query
    )
  );
  const visibleFaqSections = faqSections
    .map((section) => ({
      ...section,
      items: section.items.filter(([question, answer]) =>
        matchesQuery([question, answer], query)
      ),
    }))
    .filter((section) => section.items.length);
  const hasResults = visibleGuides.length > 0 || visibleFaqSections.length > 0;
  const navigationGuides = query ? visibleGuides : helpGuides;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="border-b border-line pb-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="app-title">Help Center</h1>
            <p className="mt-2 text-[15px] leading-6 text-muted">
              Follow Relay from finding a court to the final score. Each manual
              uses realistic demo data and the same controls you’ll see in the
              app.
            </p>
          </div>
          <ButtonLink
            href="/home?tour=1"
            variant="secondary"
            className="shrink-0 whitespace-nowrap"
          >
            Replay app tour
          </ButtonLink>
        </div>
        <form noValidate className="relative mt-5 max-w-xl">
          <MagnifyingGlass
            aria-hidden
            className="absolute left-3.5 top-3.5 text-muted"
            size={18}
          />
          <label htmlFor="help-search" className="sr-only">
            Search manuals and answers
          </label>
          <input
            id="help-search"
            name="q"
            defaultValue={query}
            placeholder="Search courts, payments, scoring…"
            className="h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </form>
      </header>

      {!query ? (
        <section
          aria-labelledby="game-lifecycle-title"
          className="border-b border-line py-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="game-lifecycle-title" className="text-lg font-[680]">
                A complete game, in order
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                New to Relay? Work through these five short manuals.
              </p>
            </div>
            <p className="score text-xs font-semibold text-muted">
              About 11 minutes total
            </p>
          </div>
          <ol className="mt-5 grid border-y border-line sm:grid-cols-5 sm:divide-x sm:divide-line">
            {helpGuides.map((guide, index) => (
              <li
                key={guide.id}
                className="border-b border-line last:border-b-0 sm:border-b-0"
              >
                <a
                  href={`#${guide.id}`}
                  className="group flex min-h-16 items-center gap-3 px-2 py-3 text-sm font-semibold hover:bg-surface-strong/60 sm:min-h-24 sm:flex-col sm:items-start sm:justify-between sm:px-3"
                >
                  <span className="score text-xs text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex flex-1 items-center gap-2 sm:flex-none">
                    {guide.title}
                    <ArrowRight
                      aria-hidden
                      className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                      size={15}
                    />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="grid gap-10 py-8 lg:grid-cols-[190px_minmax(0,1fr)]">
        <nav aria-label="Help contents" className="hidden lg:block">
          <div className="sticky top-8">
            <p className="px-2 text-xs font-semibold text-muted">Manuals</p>
            <ul className="mt-2 space-y-0.5">
              {navigationGuides.map((guide) => (
                <li key={guide.id}>
                  <a
                    href={`#${guide.id}`}
                    className="block rounded-md px-2 py-1.5 text-[13px] leading-5 text-muted hover:bg-surface-strong hover:text-ink"
                  >
                    {guide.title}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 px-2 text-xs font-semibold text-muted">
              Reference
            </p>
            <ul className="mt-2 space-y-0.5">
              <li>
                <a
                  href="#play-mode-reference"
                  className="block rounded-md px-2 py-1.5 text-[13px] text-muted hover:bg-surface-strong hover:text-ink"
                >
                  Play mode guide
                </a>
              </li>
              <li>
                <a
                  href="#quick-answers"
                  className="block rounded-md px-2 py-1.5 text-[13px] text-muted hover:bg-surface-strong hover:text-ink"
                >
                  Quick answers
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <div className="min-w-0">
          <nav
            aria-label="Manual shortcuts"
            className="-mx-4 mb-8 overflow-x-auto border-b border-line px-4 lg:hidden"
          >
            <ul className="flex w-max gap-5">
              {navigationGuides.map((guide) => (
                <li key={guide.id}>
                  <a
                    href={`#${guide.id}`}
                    className="flex min-h-11 items-center whitespace-nowrap text-sm text-muted"
                  >
                    {guide.title}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#quick-answers"
                  className="flex min-h-11 items-center whitespace-nowrap text-sm text-muted"
                >
                  Quick answers
                </a>
              </li>
            </ul>
          </nav>

          {query ? (
            <div className="mb-8 border-b border-line pb-6">
              <h2 className="text-lg font-[680]">Results for “{query}”</h2>
              <p className="mt-1 text-sm text-muted">
                {hasResults
                  ? `${visibleGuides.length} ${visibleGuides.length === 1 ? "manual" : "manuals"} and ${visibleFaqSections.reduce((count, section) => count + section.items.length, 0)} quick answers`
                  : "No manuals or quick answers match that search."}
              </p>
            </div>
          ) : null}

          {visibleGuides.length ? (
            <section aria-label="Step-by-step manuals" className="space-y-14">
              {visibleGuides.map((guide) => (
                <article
                  key={guide.id}
                  id={guide.id}
                  className="scroll-mt-8 border-b border-line pb-14"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl">
                      <h2 className="text-2xl font-[700] tracking-[-0.025em] sm:text-[28px]">
                        {guide.title}
                      </h2>
                      <p className="mt-2 text-[15px] leading-6 text-muted">
                        {guide.summary}
                      </p>
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                        <Clock aria-hidden size={15} /> {guide.time}
                      </p>
                    </div>
                    <ButtonLink
                      href={guide.action.href}
                      variant="secondary"
                      className="shrink-0"
                    >
                      {guide.action.label}
                    </ButtonLink>
                  </div>

                  <HelpProductPreview guideId={guide.id} courts={courts} />

                  <ol className="mt-7 divide-y divide-line border-y border-line">
                    {guide.steps.map((step, index) => (
                      <li
                        key={step.title}
                        className="grid gap-3 py-5 sm:grid-cols-[44px_180px_1fr] sm:items-start sm:gap-4"
                      >
                        <span className="score grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <h3 className="text-sm font-[680] leading-6">
                          {step.title}
                        </h3>
                        <p className="max-w-2xl text-sm leading-6 text-muted">
                          {step.detail}
                        </p>
                      </li>
                    ))}
                  </ol>

                  {guide.notes?.length ? (
                    <div className="mt-5 flex items-start gap-3 rounded-lg bg-surface-strong px-4 py-3.5">
                      <Info
                        aria-hidden
                        className="mt-0.5 shrink-0 text-primary"
                        size={17}
                      />
                      <div>
                        <p className="text-sm font-[650]">Good to know</p>
                        <ul className="mt-1 space-y-1 text-sm leading-5 text-muted">
                          {guide.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </section>
          ) : null}

          {!query ||
          visibleGuides.some((guide) => guide.id === "choose-a-play-mode") ? (
            <section
              id="play-mode-reference"
              className="scroll-mt-8 border-b border-line pb-14 pt-2"
            >
              <h2 className="text-2xl font-[700] tracking-[-0.025em]">
                Which play mode should we use?
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-6 text-muted">
                Choose for tonight’s attendance and goal. You can see exact
                roster requirements before Play starts.
              </p>
              <div className="mt-6 overflow-x-auto border-y border-line">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs text-muted">
                      <th scope="col" className="px-3 py-3 font-semibold">
                        Mode
                      </th>
                      <th scope="col" className="px-3 py-3 font-semibold">
                        Best for
                      </th>
                      <th scope="col" className="px-3 py-3 font-semibold">
                        How the next round works
                      </th>
                      <th scope="col" className="px-3 py-3 font-semibold">
                        Needs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {playModes.map((mode) => (
                      <tr key={mode.mode}>
                        <th
                          scope="row"
                          className="whitespace-nowrap px-3 py-4 font-[680]"
                        >
                          {mode.mode}
                        </th>
                        <td className="px-3 py-4 text-muted">{mode.bestFor}</td>
                        <td className="max-w-sm px-3 py-4 leading-6 text-muted">
                          {mode.howItMoves}
                        </td>
                        <td className="max-w-[180px] px-3 py-4 leading-5 text-muted">
                          {mode.needs}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {visibleFaqSections.length ? (
            <section id="quick-answers" className="scroll-mt-8 pt-14">
              <h2 className="text-2xl font-[700] tracking-[-0.025em]">
                Quick answers
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Short answers for exceptions, access, and common follow-ups.
              </p>
              <div className="mt-8 space-y-10">
                {visibleFaqSections.map((section) => (
                  <section
                    key={section.title}
                    id={helpSectionId(section.title)}
                  >
                    <h3 className="text-base font-[680]">{section.title}</h3>
                    <div className="mt-2 divide-y divide-line border-y border-line">
                      {section.items.map(([question, answer]) => (
                        <details key={question} className="group">
                          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium marker:hidden">
                            <span>{question}</span>
                            <span
                              aria-hidden
                              className="text-lg font-light text-muted transition-transform group-open:rotate-45"
                            >
                              +
                            </span>
                          </summary>
                          <p className="max-w-2xl pb-4 pr-8 text-sm leading-6 text-muted">
                            {answer}
                          </p>
                        </details>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ) : null}

          {!hasResults ? (
            <section className="border-y border-line py-8">
              <h2 className="font-[680]">Try a broader search</h2>
              <p className="mt-1 text-sm text-muted">
                Try “court,” “payment,” “guest,” “mode,” or “score.”
              </p>
              <a
                href="/help"
                className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary"
              >
                Clear search
              </a>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
