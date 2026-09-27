import "server-only";
import { context, type Span, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("relay-agent");

// Deliberately avoid exception recording: provider and database errors can
// contain prompts, credentials, or query values.
export function agentSpan(name: string, parent?: Span) {
  return tracer.startSpan(
    name,
    undefined,
    parent ? trace.setSpan(context.active(), parent) : undefined
  );
}

export async function agentDbSpan<T>(
  name: string,
  operation: () => Promise<T>,
  parent?: Span
): Promise<T> {
  const span = agentSpan(`agent.db.${name}`, parent);
  try {
    const result = await operation();
    span.setAttribute("agent.status", "ok");
    return result;
  } catch (error) {
    span.setAttribute("agent.status", "error");
    throw error;
  } finally {
    span.end();
  }
}
