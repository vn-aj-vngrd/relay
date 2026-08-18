import { ArrowSquareOut, EnvelopeSimple, UserCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { AdminDate } from "@/features/admin/presentation";
import { AdminFeedbackReviewForm } from "@/features/feedback/admin-feedback-review-form";
import { type FeedbackArea, feedbackAreaLabels, feedbackTypeLabels } from "@/features/feedback/domain";
import { FeedbackStatusBadge } from "@/features/feedback/feedback-status";
import { getAdminFeedbackDetail } from "@/features/feedback/queries";

export default async function AdminFeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getAdminFeedbackDetail(id);
  if (!record) notFound();
  const { feedback } = record;

  return (
    <div>
      <AdminPageHeading
        title={feedback.title}
        description="Review the player’s context, record the current triage decision, and keep private operational notes concise."
        action={<FeedbackStatusBadge status={feedback.status} />}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main>
          <section aria-labelledby="submission-details">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="font-semibold text-primary">{feedbackTypeLabels[feedback.type]}</span>
              <span className="text-muted">{feedbackAreaLabels[feedback.area as FeedbackArea]}</span>
              <AdminDate value={feedback.createdAt} includeTime />
            </div>
            <h2 id="submission-details" className="sr-only">
              Submission details
            </h2>
            <div className="mt-5 whitespace-pre-wrap border-y border-line py-6 text-[15px] leading-7">
              {feedback.description}
            </div>
            {feedback.pagePath ? (
              <div className="mt-4 flex items-center justify-between gap-4 border-b border-line pb-4 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">Related Relay page</p>
                  <p className="mt-1 truncate text-muted">{feedback.pagePath}</p>
                </div>
                <Link
                  href={feedback.pagePath}
                  className="pressable inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 font-semibold text-primary hover:bg-primary-soft"
                >
                  Open
                  <ArrowSquareOut aria-hidden size={15} />
                </Link>
              </div>
            ) : null}
          </section>

          <section aria-labelledby="review-feedback" className="mt-10">
            <h2 id="review-feedback" className="text-lg font-bold">
              Review
            </h2>
            <p className="mt-1 text-sm text-muted">Players see the status, but never the internal note.</p>
            <div className="mt-4">
              <AdminFeedbackReviewForm
                feedbackId={feedback.id}
                status={feedback.status}
                adminNote={feedback.adminNote}
              />
            </div>
          </section>
        </main>

        <aside aria-labelledby="submitted-by" className="lg:border-l lg:border-line lg:pl-7">
          <h2 id="submitted-by" className="text-sm font-bold">
            Submitted by
          </h2>
          <div className="mt-3 border-y border-line py-4">
            <div className="flex items-start gap-3">
              <UserCircle aria-hidden size={20} className="mt-0.5 shrink-0 text-muted" />
              <div className="min-w-0">
                <p className="font-semibold">{record.submitterName ?? "Profile not finished"}</p>
                {record.submitterUsername ? (
                  <Link
                    href={`/profile/${record.submitterUsername}`}
                    className="mt-1 block text-sm font-medium text-primary"
                  >
                    @{record.submitterUsername}
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 border-t border-line pt-4">
              <EnvelopeSimple aria-hidden size={19} className="mt-0.5 shrink-0 text-muted" />
              <div className="min-w-0">
                <p className="break-all text-sm">{record.submitterEmail}</p>
                <p className="mt-1 text-xs text-muted">
                  {feedback.contactAllowed ? "Follow-up allowed" : "No follow-up requested"}
                </p>
              </div>
            </div>
          </div>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-muted">Last updated</dt>
              <dd className="mt-1 font-medium">
                <AdminDate value={feedback.updatedAt} includeTime />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Reference</dt>
              <dd className="score mt-1 text-xs">{feedback.id.slice(0, 8)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
