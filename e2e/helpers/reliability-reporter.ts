import type { FullResult, Reporter, Suite } from "@playwright/test/reporter";

export default class ReliabilityReporter implements Reporter {
  private suite?: Suite;

  onBegin(_config: unknown, suite: Suite) {
    this.suite = suite;
  }

  async onEnd(result: FullResult): Promise<{ status: FullResult["status"] }> {
    const tests = this.suite?.allTests() ?? [];
    const complete =
      tests.length > 0 &&
      tests.every(
        (test) =>
          test.expectedStatus === "passed" &&
          test.results.length === 1 &&
          test.results[0].status === "passed"
      );
    return { status: complete ? result.status : "failed" };
  }
}
