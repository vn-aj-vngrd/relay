type PriceUnit =
  | "hour"
  | "player"
  | "court"
  | "session"
  | "court_hour"
  | "player_session";
type PriceStatus =
  | "unknown"
  | "free"
  | "paid"
  | "contact"
  | "donation"
  | "members"
  | "invitation";
export type ImportedOperatingPeriod = {
  dayOfWeek: number;
  sequence: number;
  opensAt: string;
  closesAt: string;
};

function parseImportedTime(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replaceAll(".", "");
  if (/(midnight|mn)$/.test(normalized)) return "00:00";
  if (/nn$/.test(normalized)) return "12:00";
  const clock = normalized.replace(/(am|pm|a|p)$/, "");
  const digits = clock.replace(":", "");
  const hourText = clock.includes(":")
    ? clock.split(":")[0]
    : digits.length <= 2
      ? digits
      : digits.slice(0, -2);
  const minuteText = clock.includes(":")
    ? clock.split(":")[1]
    : digits.length <= 2
      ? "0"
      : digits.slice(-2);
  let hour = Number(hourText);
  const minute = Number(minuteText);
  if (/(pm|p)$/.test(normalized) && hour < 12) hour += 12;
  if (/(am|a)$/.test(normalized) && hour === 12) hour = 0;
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour > 23 ||
    minute > 59
  )
    return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function structureImportedOperatingHours(
  value: string | null
): ImportedOperatingPeriod[] {
  const text = value?.trim() ?? "";
  if (!text) return [];
  if (/^(open )?24 hours$|^anytime$/i.test(text))
    return Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index + 1,
      sequence: 0,
      opensAt: "00:00",
      closesAt: "00:00",
    }));
  if (
    !/(^daily|^open daily|^monday to sunday|^mon(?:day)?[-–]sun(?:day)?|^\d)/i.test(
      text
    )
  )
    return [];

  const matches = [
    ...text.matchAll(
      /(\d{1,2}(?::?\d{2})?\s*(?:a\.?m?\.?|p\.?m?\.?|nn|mn|midnight))\s*(?:-|–|to)\s*(\d{1,2}(?::?\d{2})?\s*(?:a\.?m?\.?|p\.?m?\.?|nn|mn|midnight))/gi
    ),
  ];
  if (matches.length !== 1 || !matches[0]?.[1] || !matches[0][2]) return [];
  const opensAt = parseImportedTime(matches[0][1]);
  const closesAt = parseImportedTime(matches[0][2]);
  if (!opensAt || !closesAt) return [];
  return Array.from({ length: 7 }, (_, index) => ({
    dayOfWeek: index + 1,
    sequence: 0,
    opensAt,
    closesAt,
  }));
}

export function structureImportedPrice(value: string | null): {
  status: PriceStatus;
  amountCents: number | null;
  maxCents: number | null;
  unit: PriceUnit | null;
} {
  const text = value?.trim() ?? "";
  const lower = text.toLowerCase();
  if (/free/.test(lower))
    return { status: "free", amountCents: 0, maxCents: null, unit: null };
  if (/donation/.test(lower))
    return {
      status: "donation",
      amountCents: null,
      maxCents: null,
      unit: null,
    };
  if (/call/.test(lower))
    return { status: "contact", amountCents: null, maxCents: null, unit: null };

  const amounts =
    text.match(
      /(?:₱|p\s*)([\d,]+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(?:₱|p\s*)?([\d,]+(?:\.\d+)?))?/i
    ) ??
    text.match(/^\s*([\d,]+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*([\d,]+(?:\.\d+)?))?/);
  if (!amounts?.[1]) {
    if (/member/.test(lower))
      return {
        status: "members",
        amountCents: null,
        maxCents: null,
        unit: null,
      };
    if (/invitation/.test(lower))
      return {
        status: "invitation",
        amountCents: null,
        maxCents: null,
        unit: null,
      };
    return { status: "unknown", amountCents: null, maxCents: null, unit: null };
  }

  const cents = (amount: string | undefined) =>
    amount ? Math.round(Number(amount.replaceAll(",", "")) * 100) : null;
  const unit: PriceUnit = /(player|person|sharing)/i.test(text)
    ? "player"
    : /court/i.test(text) && /(hour|\/hr)/i.test(text)
      ? "court_hour"
      : /(hour|\/hr|\d+\s*hours)/i.test(text)
        ? "hour"
        : /(game|session)/i.test(text)
          ? "session"
          : "player";
  return {
    status: "paid",
    amountCents: cents(amounts[1]),
    maxCents: cents(amounts[2]),
    unit,
  };
}
