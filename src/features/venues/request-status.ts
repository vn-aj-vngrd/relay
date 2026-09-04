export const venueChangeRequestStatuses = [
  "submitted",
  "needs_info",
  "in_review",
  "approved",
  "partially_approved",
  "rejected",
  "duplicate",
  "withdrawn",
] as const;

export type VenueChangeRequestStatus =
  (typeof venueChangeRequestStatuses)[number];

export const openVenueChangeRequestStatuses: VenueChangeRequestStatus[] = [
  "submitted",
  "needs_info",
  "in_review",
];

export const venueChangeRequestStatusLabels: Record<
  VenueChangeRequestStatus,
  string
> = {
  submitted: "Submitted",
  needs_info: "Needs information",
  in_review: "In review",
  approved: "Applied",
  partially_approved: "Partially applied",
  rejected: "Not applied",
  duplicate: "Duplicate",
  withdrawn: "Withdrawn",
};
