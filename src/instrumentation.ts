import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  if (error instanceof Error && error.message === "The destination stream closed early.") return;
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  const errorName = error instanceof Error ? error.name : "UnknownError";

  console.error(
    JSON.stringify({
      event: "server_request_error",
      errorName,
      digest,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
    }),
  );
};
