import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupFilters } from "./group-filters";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("Groups filter controls", () => {
  it("debounces search and preserves the role", async () => {
    vi.useFakeTimers();
    render(<GroupFilters filters={{ q: "", role: "owner" }} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Friday crew" },
    });
    expect(router.push).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(router.push).toHaveBeenCalledWith(
      "/groups?q=Friday+crew&role=owner",
      { scroll: false }
    );
  });
  it("clears search and role inline without duplicate chips", () => {
    render(<GroupFilters filters={{ q: "Friday", role: "member" }} />);
    const clear = screen.getByRole("button", { name: "Clear filters" });
    expect(
      screen.getByRole("group", { name: "Filter groups" })
    ).toContainElement(clear);
    fireEvent.click(clear);
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(router.push).toHaveBeenCalledWith("/groups", { scroll: false });
  });
  it("restores the search on browser history navigation", () => {
    render(<GroupFilters filters={{ q: "", role: "any" }} />);
    window.history.replaceState(null, "", "/groups?q=Old+crew");
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(screen.getByRole("searchbox")).toHaveValue("Old crew");
  });
});
