import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { AgentMark } from "@/features/agent/agent-mark";
import {
  defaultAgentLimits,
  type PublicAgentOffer,
} from "@/features/agent/allowance";
import { AgentDemo } from "./agent-demo";

export function AgentShowcase({
  agent = { ...defaultAgentLimits, enabled: false },
}: {
  agent?: PublicAgentOffer;
}) {
  return (
    <section
      id="agent"
      aria-labelledby="landing-agent-title"
      className="scroll-mt-20 border-t border-line bg-surface px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="mb-5 flex items-center gap-2.5 text-primary">
            <AgentMark size={28} aria-hidden />
            <span className="text-lg font-semibold">Agent</span>
            {!agent.enabled ? (
              <span className="text-sm text-muted">Coming soon</span>
            ) : null}
          </div>
          <h2
            id="landing-agent-title"
            className="max-w-xl text-3xl font-[620] tracking-tight sm:text-5xl"
          >
            Ask Agent.
            <br />
            Get back to the game.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            Find your next game, see who's joining, and catch what needs your
            attention. Ask in your own words—Agent brings your games, groups,
            court listings and Relay guides into one conversation.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink">
            <li>“What games am I joining this weekend?”</li>
            <li>“Find courts near me.”</li>
            <li>“How do I start a Quick Game?”</li>
          </ul>
          <p className="mt-6 text-sm leading-6 text-muted">
            Open Actions in chat to explore available tasks. Creation, when
            enabled, requires your review and confirmation.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <ButtonLink href={agent.enabled ? "/agent" : "/pricing"}>
              {agent.enabled ? "Ask Agent" : "See Agent plans"}
              <ArrowRight size={16} aria-hidden />
            </ButtonLink>
            <span className="text-sm text-muted">
              {agent.freeMessages.toLocaleString()} messages/month on Free
            </span>
          </div>
        </div>
        <AgentDemo />
      </div>
    </section>
  );
}
