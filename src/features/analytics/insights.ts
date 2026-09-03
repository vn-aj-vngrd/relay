export const sessionFunnelStages = [
  { key: "published", label: "Games published" },
  { key: "inviteShared", label: "Invite shared" },
  { key: "rsvpSaved", label: "First RSVP saved" },
  { key: "fourPlayers", label: "Four players going" },
  { key: "playStarted", label: "Play started" },
  { key: "firstMatchCompleted", label: "First match completed" },
  { key: "sessionCompleted", label: "Game completed" },
  { key: "recapShared", label: "Recap shared" },
] as const;

export type SessionFunnelKey = (typeof sessionFunnelStages)[number]["key"];
export type SessionFunnel = Record<SessionFunnelKey, number>;

type HostPublication = { hostId: string; publishedAt: Date };

type RetentionWindow = {
  days: 14 | 30;
  eligibleHosts: number;
  retainedHosts: number;
  rate: number;
};

export function buildHostRetention(
  publications: HostPublication[],
  now = new Date()
): { fourteenDay: RetentionWindow; thirtyDay: RetentionWindow } {
  const byHost = new Map<string, number[]>();
  for (const publication of publications) {
    const times = byHost.get(publication.hostId) ?? [];
    times.push(publication.publishedAt.getTime());
    byHost.set(publication.hostId, times);
  }

  function measure(days: 14 | 30): RetentionWindow {
    const windowMs = days * 24 * 60 * 60 * 1000;
    let eligibleHosts = 0;
    let retainedHosts = 0;
    for (const times of byHost.values()) {
      times.sort((a, b) => a - b);
      const first = times[0];
      if (first == null || now.getTime() - first < windowMs) continue;
      eligibleHosts += 1;
      if (
        times.some(
          (publishedAt, index) => index > 0 && publishedAt <= first + windowMs
        )
      )
        retainedHosts += 1;
    }
    return {
      days,
      eligibleHosts,
      retainedHosts,
      rate: eligibleHosts
        ? Math.round((retainedHosts / eligibleHosts) * 100)
        : 0,
    };
  }

  return { fourteenDay: measure(14), thirtyDay: measure(30) };
}
