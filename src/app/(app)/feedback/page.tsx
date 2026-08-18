import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { feedbackAreaLabels, feedbackTypeLabels } from "@/features/feedback/domain";
import { FeedbackForm } from "@/features/feedback/feedback-form";
import { FeedbackStatusBadge } from "@/features/feedback/feedback-status";
import { getOwnFeedback } from "@/features/feedback/queries";

export default async function FeedbackPage() {
  const user = await requireUser("/feedback");
  const submissions = await getOwnFeedback(user.id);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="app-title">Send feedback</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Report a problem, suggest an improvement, or tell us what makes game night easier.
          </p>
        </div>
        <ButtonLink href="/help" variant="secondary">
          <ArrowLeft aria-hidden size={15} />
          Help Center
        </ButtonLink>
      </header>

      <section aria-labelledby="feedback-form-title" className="py-8">
        <div className="mb-5">
          <h2 id="feedback-form-title" className="text-lg font-bold">
            Tell Relay what happened
          </h2>
          <p className="mt-1 text-sm text-muted">Specific examples help us understand and prioritize the right fix.</p>
        </div>
        <FeedbackForm />
      </section>

      <section aria-labelledby="past-feedback-title" className="pb-8 pt-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="past-feedback-title" className="text-lg font-bold">
              Your feedback
            </h2>
            <p className="mt-1 text-sm text-muted">Recent submissions and their current review status.</p>
          </div>
          <span className="score text-sm text-muted">{submissions.length}</span>
        </div>
        {submissions.length ? (
          <ol className="mt-4 divide-y divide-line border-y border-line">
            {submissions.map((submission) => (
              <li key={submission.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="font-semibold">{submission.title}</p>
                    <span className="text-xs text-muted">{feedbackTypeLabels[submission.type]}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {feedbackAreaLabels[submission.area as keyof typeof feedbackAreaLabels]} ·{" "}
                    <time dateTime={submission.createdAt.toISOString()}>
                      {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(submission.createdAt)}
                    </time>
                  </p>
                </div>
                <FeedbackStatusBadge status={submission.status} />
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-4 border-y border-line py-8">
            <p className="text-sm font-semibold">No feedback sent yet</p>
            <p className="mt-1 text-sm text-muted">Your submitted reports and requests will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
