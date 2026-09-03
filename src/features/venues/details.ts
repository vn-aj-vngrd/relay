export const courtParkingStatuses = ["available", "unavailable"] as const;
export type CourtParkingStatus = (typeof courtParkingStatuses)[number];

export const courtAccessTypes = [
  "unknown",
  "public",
  "commercial",
  "members",
  "residents",
  "school_or_community",
  "invitation",
] as const;
export type CourtAccessType = (typeof courtAccessTypes)[number];

export const courtReservationPolicies = [
  "unknown",
  "walk_in",
  "reservation_required",
  "walk_in_or_reserve",
  "contact",
] as const;
export type CourtReservationPolicy = (typeof courtReservationPolicies)[number];

export const courtOperationalStatuses = [
  "unknown",
  "operating",
  "temporarily_closed",
  "seasonal",
  "opening_soon",
  "permanently_closed",
] as const;
export type CourtOperationalStatus = (typeof courtOperationalStatuses)[number];

export const courtAccessOptions = [
  { value: "unknown", label: "Not listed" },
  { value: "public", label: "Public facility" },
  { value: "commercial", label: "Commercial court" },
  { value: "members", label: "Members only" },
  { value: "residents", label: "Residents only" },
  { value: "school_or_community", label: "School or community access" },
  { value: "invitation", label: "Invitation only" },
] as const;

export const courtReservationOptions = [
  { value: "unknown", label: "Not listed" },
  { value: "walk_in", label: "Walk-ins" },
  { value: "reservation_required", label: "Reservation required" },
  { value: "walk_in_or_reserve", label: "Walk in or reserve" },
  { value: "contact", label: "Ask the court" },
] as const;

export const courtOperationalStatusOptions = [
  { value: "unknown", label: "Not confirmed" },
  { value: "operating", label: "Operating" },
  { value: "temporarily_closed", label: "Temporarily closed" },
  { value: "seasonal", label: "Seasonal" },
  { value: "opening_soon", label: "Opening soon" },
  { value: "permanently_closed", label: "Permanently closed" },
] as const;

export function formatCourtAccess(value: CourtAccessType) {
  return (
    courtAccessOptions.find((option) => option.value === value)?.label ??
    "Not listed"
  );
}

export function formatCourtReservation(value: CourtReservationPolicy) {
  return (
    courtReservationOptions.find((option) => option.value === value)?.label ??
    "Not listed"
  );
}

export function formatCourtOperationalStatus(value: CourtOperationalStatus) {
  return (
    courtOperationalStatusOptions.find((option) => option.value === value)
      ?.label ?? "Not confirmed"
  );
}

export const courtPriceUnits = [
  "hour",
  "player",
  "court",
  "session",
  "court_hour",
  "player_session",
] as const;
export type CourtPriceUnit = (typeof courtPriceUnits)[number];

export const courtPriceStatuses = [
  "unknown",
  "free",
  "paid",
  "contact",
  "donation",
  "members",
  "invitation",
] as const;
export type CourtPriceStatus = (typeof courtPriceStatuses)[number];

export const courtParkingOptions = [
  { value: "", label: "Not listed" },
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Not available" },
] as const;

export const courtPriceStatusOptions = [
  { value: "unknown", label: "Not listed" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
  { value: "contact", label: "Ask the court" },
  { value: "donation", label: "Donation" },
] as const;

export const courtPriceUnitOptions = [
  { value: "", label: "Select a pricing mode" },
  { value: "hour", label: "Per hour" },
  { value: "player", label: "Per player" },
  { value: "court", label: "Per court" },
  { value: "session", label: "Per session" },
  { value: "court_hour", label: "Per court per hour" },
  { value: "player_session", label: "Per player per session" },
] as const;

export const courtDays = [
  { value: 1, key: "monday", shortLabel: "Mon", label: "Monday" },
  { value: 2, key: "tuesday", shortLabel: "Tue", label: "Tuesday" },
  { value: 3, key: "wednesday", shortLabel: "Wed", label: "Wednesday" },
  { value: 4, key: "thursday", shortLabel: "Thu", label: "Thursday" },
  { value: 5, key: "friday", shortLabel: "Fri", label: "Friday" },
  { value: 6, key: "saturday", shortLabel: "Sat", label: "Saturday" },
  { value: 7, key: "sunday", shortLabel: "Sun", label: "Sunday" },
] as const;

export type CourtDay = (typeof courtDays)[number]["value"];
type CourtDayKey = (typeof courtDays)[number]["key"];
type CourtOperatingHoursInput = Record<
  `${CourtDayKey}${"Open" | "Close"}`,
  string
>;
export type CourtOperatingPeriod = {
  dayOfWeek: CourtDay;
  opensAt: string;
  closesAt: string;
};

function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const suffix = (hour ?? 0) >= 12 ? "PM" : "AM";
  const displayHour = (hour ?? 0) % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export const courtTimeOptions = [
  { value: "", label: "Not listed" },
  ...Array.from({ length: 48 }, (_, index) => {
    const value = `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`;
    return { value, label: timeLabel(value) };
  }),
] as const;

export const courtAvailabilityOptions = [
  { value: "all", label: "Any availability" },
  { value: "open", label: "Open now" },
  { value: "24-hours", label: "Open 24 hours" },
  { value: "during", label: "Open during a time range" },
] as const;

export const courtBookingDayOptions = [
  { value: "today", label: "Today" },
  ...courtDays.map((day) => ({ value: String(day.value), label: day.label })),
] as const;

export const courtBookingTimeOptions = courtTimeOptions.slice(1);

const php = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const priceUnitLabels: Record<CourtPriceUnit, string> = {
  hour: "per hour",
  player: "per player",
  court: "per court",
  session: "per session",
  court_hour: "per court per hour",
  player_session: "per player per session",
};

export function formatCourtPrice(input: {
  priceStatus: CourtPriceStatus;
  priceAmountCents: number | null;
  priceMaxCents: number | null;
  priceUnit: CourtPriceUnit | null;
}) {
  if (input.priceStatus === "free") return "Free";
  if (input.priceStatus === "contact") return "Ask the court";
  if (input.priceStatus === "donation") return "Donation";
  if (input.priceStatus === "members") return "Members only";
  if (input.priceStatus === "invitation") return "Invitation only";
  if (
    input.priceStatus !== "paid" ||
    input.priceAmountCents == null ||
    !input.priceUnit
  )
    return null;
  const amount = php.format(input.priceAmountCents / 100);
  const range =
    input.priceMaxCents == null
      ? amount
      : `${amount}–${php.format(input.priceMaxCents / 100)}`;
  const unit = priceUnitLabels[input.priceUnit];
  return unit ? `${range} ${unit}` : range;
}

export function formatCourtParking(status: CourtParkingStatus | null) {
  if (status === "available") return "Available";
  if (status === "unavailable") return "Not available";
  return null;
}

export function pesosToCents(amount: number | "") {
  return amount === "" ? null : Math.round(amount * 100);
}

export function toCourtPriceStorage(input: {
  priceStatus: CourtPriceStatus;
  priceAmount: number | "";
  priceMax: number | "";
  priceUnit: CourtPriceUnit | "";
}) {
  if (input.priceStatus === "free")
    return {
      priceStatus: input.priceStatus,
      priceAmountCents: 0,
      priceMaxCents: null,
      priceUnit: null,
    };
  if (input.priceStatus === "paid")
    return {
      priceStatus: input.priceStatus,
      priceAmountCents: pesosToCents(input.priceAmount),
      priceMaxCents: pesosToCents(input.priceMax),
      priceUnit: input.priceUnit || null,
    };
  return {
    priceStatus: input.priceStatus,
    priceAmountCents: null,
    priceMaxCents: null,
    priceUnit: null,
  };
}

export function buildCourtOperatingHours(
  input: Partial<CourtOperatingHoursInput>
): CourtOperatingPeriod[] {
  return courtDays.flatMap(({ value, key }) => {
    const opensAt = input[`${key}Open`];
    const closesAt = input[`${key}Close`];
    return typeof opensAt === "string" &&
      typeof closesAt === "string" &&
      opensAt &&
      closesAt
      ? [{ dayOfWeek: value, opensAt, closesAt }]
      : [];
  });
}

function periodLabel(
  period: Pick<CourtOperatingPeriod, "opensAt" | "closesAt">
) {
  if (period.opensAt === period.closesAt) return "Open 24 hours";
  return `${timeLabel(period.opensAt)}–${timeLabel(period.closesAt)}`;
}

export function formatCourtOperatingHours(periods: CourtOperatingPeriod[]) {
  if (!periods.length) return null;
  const byDay = new Map<CourtDay, CourtOperatingPeriod[]>();
  for (const period of periods)
    byDay.set(period.dayOfWeek, [
      ...(byDay.get(period.dayOfWeek) ?? []),
      period,
    ]);
  const signature = (day: CourtDay) =>
    (byDay.get(day) ?? [])
      .map((period) => `${period.opensAt}-${period.closesAt}`)
      .join(",");
  const allDaysMatch = courtDays.every(
    (day) => signature(day.value) && signature(day.value) === signature(1)
  );
  if (allDaysMatch)
    return `Daily · ${(byDay.get(1) ?? []).map(periodLabel).join(", ")}`;
  const weekdaysMatch = [1, 2, 3, 4, 5].every(
    (day) => signature(day as CourtDay) === signature(1)
  );
  const weekendsMatch = signature(6) === signature(7);
  if (weekdaysMatch && weekendsMatch) {
    return [
      signature(1)
        ? `Mon–Fri ${(byDay.get(1) ?? []).map(periodLabel).join(", ")}`
        : null,
      signature(6)
        ? `Sat–Sun ${(byDay.get(6) ?? []).map(periodLabel).join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("; ");
  }
  return courtDays
    .flatMap((day) => {
      const dayPeriods = byDay.get(day.value);
      return dayPeriods?.length
        ? [`${day.shortLabel} ${dayPeriods.map(periodLabel).join(", ")}`]
        : [];
    })
    .join("; ");
}

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

function courtTimeForDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  return {
    dayOfWeek: courtDays.find((day) => day.shortLabel === weekday)?.value,
    currentMinutes:
      Number(parts.find((part) => part.type === "hour")?.value) * 60 +
      Number(parts.find((part) => part.type === "minute")?.value),
  };
}

function adjacentDay(dayOfWeek: CourtDay, offset: -1 | 1): CourtDay {
  if (offset === -1) return (dayOfWeek === 1 ? 7 : dayOfWeek - 1) as CourtDay;
  return (dayOfWeek === 7 ? 1 : dayOfWeek + 1) as CourtDay;
}

function periodsForDayTimeline(
  periods: CourtOperatingPeriod[],
  dayOfWeek: CourtDay
) {
  const interval = (period: CourtOperatingPeriod, offset = 0) => {
    const opensAt = minutes(period.opensAt) + offset;
    const rawClosesAt = minutes(period.closesAt) + offset;
    return {
      opensAt,
      closesAt: rawClosesAt <= opensAt ? rawClosesAt + 24 * 60 : rawClosesAt,
    };
  };
  const current = periods
    .filter((period) => period.dayOfWeek === dayOfWeek)
    .map((period) => interval(period));
  const carriedOver = periods
    .filter(
      (period) =>
        period.dayOfWeek === adjacentDay(dayOfWeek, -1) &&
        minutes(period.closesAt) < minutes(period.opensAt)
    )
    .map((period) => interval(period, -24 * 60));
  const following = periods
    .filter((period) => period.dayOfWeek === adjacentDay(dayOfWeek, 1))
    .map((period) => interval(period, 24 * 60));

  return [...carriedOver, ...current, ...following]
    .sort((left, right) => left.opensAt - right.opensAt)
    .reduce<Array<{ opensAt: number; closesAt: number }>>((merged, period) => {
      const previous = merged.at(-1);
      if (previous && period.opensAt <= previous.closesAt)
        previous.closesAt = Math.max(previous.closesAt, period.closesAt);
      else merged.push({ ...period });
      return merged;
    }, []);
}

export function isCourtOpenAt(
  periods: CourtOperatingPeriod[],
  date = new Date()
): boolean | null {
  if (!periods.length) return null;
  const courtTime = courtTimeForDate(date);
  if (!courtTime.dayOfWeek) return null;
  return periodsForDayTimeline(periods, courtTime.dayOfWeek).some(
    (period) =>
      courtTime.currentMinutes >= period.opensAt &&
      courtTime.currentMinutes < period.closesAt
  );
}

export function isCourtOpenDuringOnDay(
  periods: CourtOperatingPeriod[],
  startTime: string,
  endTime: string,
  dayOfWeek: CourtDay
): boolean | null {
  if (!periods.length) return null;
  const startsAt = minutes(startTime);
  const endsAtRaw = minutes(endTime);
  const endsAt = endsAtRaw <= startsAt ? endsAtRaw + 24 * 60 : endsAtRaw;
  return periodsForDayTimeline(periods, dayOfWeek).some(
    (period) => startsAt >= period.opensAt && endsAt <= period.closesAt
  );
}

export function isCourtOpenDuring(
  periods: CourtOperatingPeriod[],
  startTime: string,
  endTime: string,
  date = new Date()
): boolean | null {
  if (!periods.length) return null;
  const { dayOfWeek } = courtTimeForDate(date);
  return dayOfWeek
    ? isCourtOpenDuringOnDay(periods, startTime, endTime, dayOfWeek)
    : null;
}

export function isCourtOpen24Hours(periods: CourtOperatingPeriod[]) {
  return courtDays.every(({ value }) =>
    periods.some(
      (period) =>
        period.dayOfWeek === value && period.opensAt === period.closesAt
    )
  );
}
