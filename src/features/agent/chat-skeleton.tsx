export function AgentChatSkeleton() {
  return (
    <p
      role="status"
      aria-label="Restoring chat"
      aria-busy="true"
      className="text-shimmer inline-block py-3 text-sm text-muted motion-reduce:animate-none"
    >
      Restoring chat…
    </p>
  );
}
