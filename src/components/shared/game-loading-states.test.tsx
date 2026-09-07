import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OverviewLoading from "@/app/(app)/games/[id]/(overview)/loading";
import ChatLoading from "@/app/(app)/games/[id]/chat/loading";
import PaymentsLoading from "@/app/(app)/games/[id]/payments/loading";
import PlayLoading from "@/app/(app)/games/[id]/play/loading";
import PlayersLoading from "@/app/(app)/games/[id]/players/loading";
import StoryLoading from "@/app/(app)/games/[id]/story/loading";
import PublicOverviewLoading from "@/app/s/[slug]/(plan)/loading";
import PublicChatLoading from "@/app/s/[slug]/chat/loading";
import PublicPaymentsLoading from "@/app/s/[slug]/payments/loading";
import PublicPlayLoading from "@/app/s/[slug]/play/loading";
import PublicPlayersLoading from "@/app/s/[slug]/players/loading";
import PublicStoryLoading from "@/app/s/[slug]/story/loading";

afterEach(cleanup);

describe("authenticated game loading states", () => {
  const states = [
    ["Overview", "Loading game overview", OverviewLoading],
    ["Play", "Loading Play", PlayersLoading],
    ["Play", "Loading Play", PlayLoading],
    ["Chat", "Loading chat", ChatLoading],
    ["Payments", "Loading payments", PaymentsLoading],
    ["Story", "Loading session story", StoryLoading],
  ] as const;

  it.each(states)(
    "keeps %s accessible without a visible loading header or subtitle",
    (title, loadingLabel, Loading) => {
      const { container } = render(<Loading />);
      expect(screen.getByRole("heading", { name: title })).toHaveClass(
        "sr-only"
      );
      expect(container.querySelector(".game-page-intro")).toBeNull();
      expect(
        screen.getByRole("status", { name: loadingLabel })
      ).toHaveAttribute("aria-busy", "true");
      expect(
        screen.queryByRole("navigation", { name: "Game navigation" })
      ).not.toBeInTheDocument();
    }
  );
});

describe("public game loading states", () => {
  const states = [
    ["Overview", "Loading game plan", PublicOverviewLoading],
    ["Play", "Loading play and scores", PublicPlayersLoading],
    ["Play", "Loading play and scores", PublicPlayLoading],
    ["Chat", "Loading session chat", PublicChatLoading],
    ["Your payment", "Loading payment details", PublicPaymentsLoading],
    ["Story", "Loading session story", PublicStoryLoading],
  ] as const;

  it.each(states)(
    "keeps the public %s shell and marks only its content busy",
    (tab, loadingLabel, Loading) => {
      const { container } = render(<Loading />);
      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: tab })).toHaveClass("sr-only");
      expect(
        container.querySelector(
          ".public-tab-title, .public-tab-description, .game-page-intro"
        )
      ).toBeNull();
      expect(
        screen.getByRole("status", { name: loadingLabel })
      ).toHaveAttribute("aria-busy", "true");
    }
  );
});
