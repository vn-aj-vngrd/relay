import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OverviewLoading from "@/app/(app)/games/[id]/loading";
import ChatLoading from "@/app/(app)/games/[id]/chat/loading";
import PaymentsLoading from "@/app/(app)/games/[id]/payments/loading";
import PlayLoading from "@/app/(app)/games/[id]/play/loading";
import PlayersLoading from "@/app/(app)/games/[id]/players/loading";

afterEach(cleanup);

describe("authenticated game loading states", () => {
  const states = [
    ["Overview", "Loading game overview", OverviewLoading],
    ["Players", "Loading players", PlayersLoading],
    ["Play", "Loading Play", PlayLoading],
    ["Chat", "Loading chat", ChatLoading],
    ["Payments", "Loading payments", PaymentsLoading],
  ] as const;

  it.each(states)("keeps the %s title readable while only content is busy", (title, loadingLabel, Loading) => {
    render(<Loading />);
    expect(screen.getByRole("heading", { name: title })).toBeVisible();
    expect(screen.getByRole("status", { name: loadingLabel })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("navigation", { name: "Game navigation" })).not.toBeInTheDocument();
  });
});
