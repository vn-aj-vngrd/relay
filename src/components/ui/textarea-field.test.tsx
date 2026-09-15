import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

it("keeps multiline field height automatic while matching vertical and side padding", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const base = css.match(/^\.field \{[^}]+\}/m)?.[0];
  const multiline = css.match(/^textarea\.field \{[^}]+\}/m)?.[0];
  const style = document.createElement("style");
  style.textContent = `${base}\n${multiline}`;
  document.head.append(style);
  try {
    render(<textarea aria-label="Policy" className="field" rows={4} />);
    const field = screen.getByRole("textbox", { name: "Policy" });
    const computed = getComputedStyle(field);
    expect(computed.height).toBe("auto");
    expect(computed.paddingLeft).toBe("14px");
    expect(computed.paddingBlock).toBe("0.875rem");
    expect(field).toHaveAttribute("rows", "4");
  } finally {
    style.remove();
  }
});
