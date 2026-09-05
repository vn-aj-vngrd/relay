import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ insert: vi.fn() }));
vi.mock("next/navigation", () => ({ useServerInsertedHTML: mocks.insert }));

import { BootstrapScripts } from "./bootstrap-scripts";

function serverInsertion() {
  return mocks.insert.mock.lastCall?.[0] as () => ReactNode;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BootstrapScripts", () => {
  it("does not render executable scripts during client rendering", () => {
    const error = vi.spyOn(console, "error");
    try {
      const { container, rerender } = render(<BootstrapScripts development />);
      rerender(<BootstrapScripts development />);
      expect(container.querySelector("script")).toBeNull();
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("inserts development cleanup before theme initialization once per server stream", () => {
    render(<BootstrapScripts development />);
    const insert = serverInsertion();
    const html = renderToStaticMarkup(insert());
    expect(html).toContain('id="relay-development-sw-cleanup"');
    expect(html).toContain('id="relay-theme-init"');
    expect(html.indexOf('id="relay-development-sw-cleanup"')).toBeLessThan(
      html.indexOf('id="relay-theme-init"')
    );
    expect(insert()).toBeNull();
  });

  it("omits development cleanup in production", () => {
    render(<BootstrapScripts development={false} />);
    const html = renderToStaticMarkup(serverInsertion()());
    expect(html).toContain('id="relay-theme-init"');
    expect(html).not.toContain("relay-development-sw-cleanup");
  });
});
