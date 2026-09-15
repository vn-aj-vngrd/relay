import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { AgentMark } from "@/features/agent/agent-mark";
import {
  defaultAgentLimits,
  type PublicAgentOffer,
} from "@/features/agent/allowance";

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
            attention. Ask in your own words—Agent brings your games, groups and
            Relay guides into one conversation.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink">
            <li>“What games am I joining this weekend?”</li>
            <li>“Show open games tomorrow.”</li>
            <li>“How do I start a Quick Game?”</li>
          </ul>
          <p className="mt-6 text-sm leading-6 text-muted">
            Read-only for now. Agent can explain your games, but cannot create,
            join or change them.
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
        <figure
          className="min-w-0 rounded-xl border border-line bg-canvas p-5 sm:p-7"
          aria-label="Illustrative Agent conversation"
        >
          <figcaption className="mb-6 flex items-center justify-between gap-4 text-xs text-muted">
            <span>Example conversation</span>
            <span>Illustrative game</span>
          </figcaption>
          <p className="ml-8 rounded-xl bg-surface-strong px-4 py-3 text-sm leading-6">
            When is my next game, and who's joining?
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm font-semibold">
            <AgentMark size={18} className="text-primary" aria-hidden />
            Agent
          </div>
          <p className="mt-3 text-sm leading-7">
            Your next game is <strong>Saturday doubles</strong>, Saturday at 7
            PM. Alex, Bea and Marco are Going. Jamie is waitlisted.
          </p>
          <p className="mt-3 text-sm leading-7">
            The court booking still needs confirmation.
          </p>
          <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-muted">
            Answers use the game details you can access. Check the linked
            records before making plans.
          </p>
        </figure>
      </div>
    </section>
  );
}
