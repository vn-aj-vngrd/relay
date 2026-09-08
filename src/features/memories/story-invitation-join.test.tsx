import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildSessionRecap } from "./recap";
import { RecapShareCard } from "./recap-share-card";
import {
  framedInvitationLayout,
  invitationSeparators,
} from "./story-framed-invitation";
import {
  storyInvitationHeader,
  storyInvitationLayout,
} from "./story-invitation-layout";
import * as storyPhoto from "./story-photo";
import { storyRegionStyle } from "./story-scene";
import { storyThemes } from "./story-theme";

const mocks = vi.hoisted(() => ({ toCanvas: vi.fn() }));
vi.mock("qrcode", () => ({ toCanvas: mocks.toCanvas }));

const url = "https://relay.example/s/saturday-night-123abc";
const props = {
  title: "Saturday night",
  venue: "Community courts",
  date: "August 19 · 6–8 PM",
  accent: "#635bde",
  recap: buildSessionRecap([], []),
  photos: [],
  phase: "published" as const,
  joinUrl: url,
  invitation: {
    hostName: "Van",
    priceLabel: "Price not set",
    goingCount: 4,
    capacity: 8,
    requiresApproval: true,
    waitlistOpen: false,
  },
};
const context = {
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  fillText: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  measureText: vi.fn((text: string) => ({ width: text.length * 12 })),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.toCanvas.mockResolvedValue(undefined);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,cXI="
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback) => callback(new Blob(["png"], { type: "image/png" }))
  );
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:story"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
    () => undefined
  );
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function customize() {
  fireEvent.click(screen.getByRole("button", { name: /Customize story/ }));
}

describe("invitation join details", () => {
  it("keeps Join details spacing outside the option rail reset", () => {
    render(<RecapShareCard {...props} />);
    customize();
    expect(
      screen.getByRole("group", { name: "Join details options" }).parentElement
        ?.parentElement
    ).toHaveClass("mt-3");
  });

  it.each(["Invitation"])(
    "keeps %s game facts separate and truthful in preview and export",
    async (focus) => {
      const { container } = render(<RecapShareCard {...props} />);
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Download PNG" })
        ).toBeEnabled()
      );
      fireEvent.click(screen.getByRole("button", { name: focus }));
      expect(
        container.querySelector('[data-story-fact="title"]')
      ).toHaveTextContent(props.title);
      expect(
        container.querySelector('[data-story-fact="schedule"]')
      ).toHaveTextContent(props.date);
      expect(
        container.querySelector('[data-story-fact="location"]')
      ).toHaveTextContent(props.venue);
      const recruiting = focus === "Who’s in?";
      expect(
        container.querySelector('[data-story-fact="going"]')
      ).toHaveTextContent(recruiting ? "4 of 8 going" : "4/8 Going");
      expect(
        container.querySelector('[data-story-fact="availability"]')
      ).toHaveTextContent(
        recruiting
          ? "RSVP to join · Host approval required"
          : "4 spots open · Host approval required"
      );
      if (recruiting) {
        expect(
          container.querySelector('[data-story-fact="headline"]')
        ).toHaveTextContent("4 spots open");
      } else {
        expect(
          container.querySelector('[data-story-fact="headline"]')
        ).toBeNull();
      }
      expect(
        container.querySelector('[data-story-region="join"]')
      ).toHaveTextContent(
        recruiting ? "Scan to view game and join" : "Scan to view game and RSVP"
      );
      expect(
        container.querySelector('[data-story-fact="price"] strong')
      ).toBeNull();
      expect(
        container.querySelectorAll('[data-story-separator="plan-rsvp"]')
      ).toHaveLength(1);
      fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
      const layout = storyInvitationLayout({
        ...props,
        template: focus === "Invitation" ? "invitation" : "spots",
        customNote: "",
        theme: "minimal",
        placement: "center",
        joinMode: "qr",
      });
      await waitFor(() =>
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce()
      );
      const separator = invitationSeparators(layout)[0];
      expect(
        container.querySelector('[data-story-separator="plan-rsvp"]')
      ).toHaveAttribute("y", String(separator.y));
      expect(context.fillRect).toHaveBeenCalledWith(
        separator.x,
        separator.y,
        separator.width,
        separator.height
      );
      for (const block of layout.blocks) {
        block.lines.forEach((line, index) =>
          expect(context.fillText).toHaveBeenCalledWith(
            line,
            block.x,
            block.baseline + index * block.size * 1.25
          )
        );
      }
    }
  );

  for (const { id: theme, label } of storyThemes) {
    for (const template of ["invitation"] as const) {
      it.each([false, true])(
        `${theme}/${template} keeps OFF/QR/link header, typography, width and shared Canvas coordinates (background photo: %s)`,
        async (hasPhoto) => {
          vi.stubGlobal("Path2D", class {});
          vi.spyOn(storyPhoto, "drawStoryPhoto").mockResolvedValue(undefined);
          const { container } = render(
            <RecapShareCard
              {...props}
              photos={
                hasPhoto
                  ? [{ id: "court", url: "/court.png", alt: "Our court" }]
                  : []
              }
            />
          );
          await waitFor(() =>
            expect(
              screen.getByRole("button", { name: "Download PNG" })
            ).toBeEnabled()
          );
          fireEvent.click(
            screen.getByRole("button", {
              name: template === "invitation" ? "Invitation" : "Who’s in?",
            })
          );
          customize();
          fireEvent.click(screen.getByRole("button", { name: label }));
          if (hasPhoto) {
            fireEvent.click(screen.getByRole("button", { name: "Background" }));
            fireEvent.click(screen.getByRole("button", { name: "Our court" }));
            fireEvent.click(
              screen.getByRole("button", { name: "Full background" })
            );
          }
          const off = storyInvitationLayout({
            ...props,
            template,
            customNote: "",
            theme,
            placement: "center",
            joinMode: "off",
          });
          for (const joinMode of ["off", "qr", "link"] as const) {
            fireEvent.click(
              screen.getByRole("button", {
                name: { off: "Off", qr: "QR + link", link: "Link only" }[
                  joinMode
                ],
              })
            );
            await waitFor(() =>
              expect(
                screen.getByRole("button", { name: "Download PNG" })
              ).toBeEnabled()
            );
            const layout = storyInvitationLayout({
              ...props,
              template,
              customNote: "",
              theme,
              placement: "center",
              joinMode,
            });
            expect(layout.factor).toBe(1);
            expect(
              container.querySelector("[data-story-fitted-content]")
            ).toBeNull();
            const header = container.querySelector(
              '[data-story-region="header"] text'
            );
            expect(header).toHaveAttribute(
              "x",
              String(storyInvitationHeader.x)
            );
            expect(header).toHaveAttribute(
              "y",
              String(storyInvitationHeader.baseline)
            );
            expect(header).toHaveAttribute(
              "font-size",
              String(storyInvitationHeader.size)
            );
            for (const [index, block] of layout.blocks.entries()) {
              const preview = container.querySelector(
                `[data-story-fact="${block.id}"]`
              );
              expect(preview).toHaveAttribute("x", String(off.blocks[index].x));
              expect(preview).toHaveAttribute(
                "font-size",
                String(off.blocks[index].size)
              );
              expect(preview).toHaveAttribute("y", String(block.baseline));
            }
            context.fillText.mockClear();
            vi.mocked(HTMLAnchorElement.prototype.click).mockClear();
            fireEvent.click(
              screen.getByRole("button", { name: "Download PNG" })
            );
            await waitFor(() =>
              expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce()
            );
            expect(context.fillText).toHaveBeenCalledWith(
              "RELAY · GAME INVITE · CURRENT PLAN",
              storyInvitationHeader.x,
              storyInvitationHeader.baseline
            );
            for (const block of layout.blocks) {
              block.lines.forEach((line, index) =>
                expect(context.fillText).toHaveBeenCalledWith(
                  line,
                  block.x,
                  block.baseline + index * block.size * 1.25
                )
              );
            }
            expect(context.scale).not.toHaveBeenCalledWith(0.8, 0.8);
            expect(context.scale).not.toHaveBeenCalledWith(0.9, 0.9);
          }
        }
      );
    }
  }

  it.each(storyThemes)(
    "keeps $label link footer palette and geometry in expanded preview and Canvas",
    async ({ label }) => {
      vi.stubGlobal("Path2D", class {});
      const { container } = render(<RecapShareCard {...props} />);
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Download PNG" })
        ).toBeEnabled()
      );
      customize();
      fireEvent.click(screen.getByRole("button", { name: label }));
      fireEvent.click(screen.getByRole("button", { name: "Link only" }));
      const footer = container.querySelector('[data-story-region="join"] rect');
      const surface = container.querySelector(
        "[data-story-theme]"
      ) as HTMLElement;
      expect(footer).toHaveAttribute("height", "192");
      const footerColor = document.createElement("div");
      footerColor.style.backgroundColor = footer?.getAttribute("fill") ?? "";
      expect(footerColor.style.backgroundColor).toBe(
        surface.style.backgroundColor
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Expand story preview" })
      );
      const dialog = screen.getByRole("dialog");
      expect(
        dialog.querySelector('[data-story-region="composition"]')
      ).toHaveStyle({ width: "100%", height: "100%" });
      expect(
        dialog.querySelector('[data-story-region="join"] rect')
      ).toHaveAttribute("fill", footer?.getAttribute("fill"));
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Download PNG" })
      );
      await waitFor(() =>
        expect(context.fillRect).toHaveBeenCalledWith(0, 1728, 1080, 192)
      );
    }
  );

  it("offers only Invitation while preserving full, waitlist and approval facts", () => {
    const { container } = render(
      <RecapShareCard
        {...props}
        invitation={{ ...props.invitation, goingCount: 8, waitlistOpen: true }}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Who’s in?" })
    ).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole("group", { name: "Story focus options" })
      ).getAllByRole("button")
    ).toHaveLength(1);
    expect(
      container.querySelector('[data-story-fact="title"]')
    ).toHaveTextContent(props.title);
    expect(
      container.querySelector('[data-story-fact="going"]')
    ).toHaveTextContent("8/8 Going");
    expect(
      container.querySelector('[data-story-fact="availability"]')
    ).toHaveTextContent("Host approval required · Waitlist open");
  });

  it("defaults to local QR + canonical link, reserves matching preview/export bounds without editor link controls", async () => {
    const { container } = render(<RecapShareCard {...props} />);
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled()
    );
    expect(mocks.toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      url,
      {
        width: 1024,
        margin: 4,
        errorCorrectionLevel: "M",
        color: { dark: "#111827", light: "#ffffff" },
      }
    );
    customize();
    expect(screen.getByRole("button", { name: "QR + link" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      container.querySelector('[data-story-region="composition"]')
    ).toHaveStyle({ left: "0%", top: "0%", width: "100%", height: "100%" });
    expect(
      container.querySelector('[data-story-region="join"] image')
    ).toHaveAttribute("width", "288");
    expect(
      screen.queryByRole("button", { name: "Copy game link" })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Game link")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
    await waitFor(() =>
      expect(context.drawImage).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        72,
        1584,
        288,
        288
      )
    );
    expect(context.translate).not.toHaveBeenCalledWith(108, 0);
    expect(context.scale).not.toHaveBeenCalledWith(0.8, 0.8);
    expect(context.fillRect).toHaveBeenCalledWith(0, 1536, 1080, 384);
  });

  it.each(
    storyThemes.flatMap(({ id, label }) =>
      (["top", "center", "bottom"] as const).map((placement) => ({
        id,
        label,
        placement,
      }))
    )
  )(
    "keeps $id / $placement photo placement and crop independent of the join footer",
    async ({ id, label, placement }) => {
      vi.stubGlobal("Path2D", class {});
      const drawPhoto = vi
        .spyOn(storyPhoto, "drawStoryPhoto")
        .mockResolvedValue(undefined);
      const { container } = render(
        <RecapShareCard
          {...props}
          photos={[{ id: "court", url: "/court.png", alt: "Our court" }]}
        />
      );
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Download PNG" })
        ).toBeEnabled()
      );
      customize();
      fireEvent.click(screen.getByRole("button", { name: label }));
      fireEvent.click(screen.getByRole("button", { name: "Background" }));
      fireEvent.click(screen.getByRole("button", { name: "Our court" }));
      fireEvent.change(screen.getByLabelText("Photo crop"), {
        target: { value: "75" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Framed foreground" })
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: placement[0].toUpperCase() + placement.slice(1),
        })
      );
      const layout = framedInvitationLayout({
        ...props,
        template: "invitation",
        customNote: "",
        theme: id,
        placement,
        joinMode: "qr",
      });
      const scene = layout.scene;
      expect(
        container.querySelector('[data-story-region="composition"]')
      ).toHaveStyle({ left: "0%", width: "100%", height: "100%" });
      expect(container.querySelector("[data-story-fitted-content]")).toBeNull();
      expect(
        container.querySelector('[data-story-fact="title"]')
      ).toHaveAttribute("font-size", "72");
      expect(
        container.querySelector('[data-story-fact="schedule"]')
      ).toHaveAttribute("font-size", "36");
      expect(
        container.querySelector('[data-story-region="photo"]')
      ).toHaveStyle(storyRegionStyle(scene.photo));
      expect(
        container.querySelector('[data-story-region="photo"] img')
      ).toHaveStyle({ objectPosition: "center 75%" });
      fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
      await waitFor(() =>
        expect(drawPhoto).toHaveBeenCalledWith(
          context,
          "/court.png",
          1080,
          1920,
          75,
          scene.photo
        )
      );
      await waitFor(() =>
        expect(context.drawImage).toHaveBeenCalledWith(
          expect.any(HTMLCanvasElement),
          72,
          1584,
          288,
          288
        )
      );
      expect(context.scale).not.toHaveBeenCalledWith(0.8, 0.8);
      for (const block of layout.blocks) {
        block.lines.forEach((line, index) =>
          expect(context.fillText).toHaveBeenCalledWith(
            line,
            block.x,
            block.baseline + index * block.size * 1.25
          )
        );
      }
      fireEvent.click(screen.getByRole("button", { name: "Full background" }));
      expect(
        screen.queryByRole("group", { name: "Photo placement options" })
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText("Photo crop")).toHaveValue("75");
      fireEvent.click(
        screen.getByRole("button", { name: "Framed foreground" })
      );
      expect(container.querySelector("[data-story-theme]")).toHaveAttribute(
        "data-photo-placement",
        placement
      );
    }
  );

  it.each(["qr", "link", "off"] as const)(
    "reflows framed Invitation with a caption in %s preview and export",
    async (joinMode) => {
      vi.stubGlobal("Path2D", class {});
      const drawPhoto = vi
        .spyOn(storyPhoto, "drawStoryPhoto")
        .mockResolvedValue(undefined);
      const { container } = render(
        <RecapShareCard
          {...props}
          photos={[{ id: "court", url: "/court.png", alt: "Our court" }]}
        />
      );
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Download PNG" })
        ).toBeEnabled()
      );
      fireEvent.click(screen.getByRole("button", { name: "Invitation" }));
      customize();
      fireEvent.click(
        screen.getByRole("button", {
          name: { qr: "QR + link", link: "Link only", off: "Off" }[joinMode],
        })
      );
      fireEvent.click(screen.getByRole("button", { name: "Scrapbook" }));
      fireEvent.click(screen.getByRole("button", { name: "Background" }));
      fireEvent.click(screen.getByRole("button", { name: "Our court" }));
      fireEvent.click(
        screen.getByRole("button", { name: "Framed foreground" })
      );
      fireEvent.click(screen.getByRole("button", { name: "Message" }));
      const customNote =
        "Bring your paddle and stay for a few friendly games with us.";
      fireEvent.change(screen.getByLabelText(/Personal line/), {
        target: { value: customNote },
      });
      const layout = framedInvitationLayout({
        ...props,
        template: "invitation",
        customNote,
        theme: "scrapbook",
        placement: "center",
        joinMode,
      });
      expect(container.querySelector("[data-story-fitted-content]")).toBeNull();
      expect(
        container.querySelector('[data-story-fact="note"]')
      ).toHaveTextContent(customNote);
      expect(
        container.querySelector('[data-story-region="photo"]')
      ).toHaveStyle(storyRegionStyle(layout.scene.photo));
      fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
      await waitFor(() =>
        expect(drawPhoto).toHaveBeenCalledWith(
          context,
          "/court.png",
          1080,
          1920,
          50,
          layout.scene.photo
        )
      );
      await waitFor(() =>
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce()
      );
      for (const block of layout.blocks)
        block.lines.forEach((line, index) =>
          expect(context.fillText).toHaveBeenCalledWith(
            line,
            block.x,
            block.baseline + index * block.size * 1.25
          )
        );
      expect(context.scale).not.toHaveBeenCalledWith(0.8, 0.8);
      expect(context.scale).not.toHaveBeenCalledWith(0.9, 0.9);
    }
  );

  it("retains mode when reselecting Invitation; Off removes footer without adding link controls", async () => {
    const { container } = render(<RecapShareCard {...props} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled()
    );
    customize();
    fireEvent.click(screen.getByRole("button", { name: "Link only" }));
    expect(
      container.querySelector('[data-story-region="join"] image')
    ).toBeNull();
    expect(
      container.querySelector('[data-story-region="composition"]')
    ).toHaveStyle({ left: "0%", width: "100%", height: "100%" });
    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
    await waitFor(() =>
      expect(context.fillRect).toHaveBeenCalledWith(0, 1728, 1080, 192)
    );
    expect(context.translate).not.toHaveBeenCalledWith(54, 0);
    expect(context.scale).not.toHaveBeenCalledWith(0.9, 0.9);
    fireEvent.click(screen.getByRole("button", { name: "Invitation" }));
    expect(screen.getByRole("button", { name: "Link only" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    fireEvent.click(screen.getByRole("button", { name: "Off" }));
    expect(container.querySelector('[data-story-region="join"]')).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Copy game link" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
  });

  it.each([undefined, null])(
    "does not offer join controls without server eligibility (%s)",
    (joinUrl) => {
      const { container } = render(
        <RecapShareCard {...props} joinUrl={joinUrl} />
      );
      customize();
      expect(screen.queryByText("Join details")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Copy game link" })
      ).not.toBeInTheDocument();
      expect(container.querySelector('[data-story-region="join"]')).toBeNull();
      expect(mocks.toCanvas).not.toHaveBeenCalled();
    }
  );

  it.each(["live", "completed"] as const)(
    "ignores even a supplied join URL for %s focuses",
    (phase) => {
      render(<RecapShareCard {...props} phase={phase} />);
      customize();
      expect(screen.queryByText("Join details")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Copy game link" })
      ).not.toBeInTheDocument();
      expect(mocks.toCanvas).not.toHaveBeenCalled();
    }
  );

  it("explains QR failure and requires explicit link-only export without link-copy controls", async () => {
    mocks.toCanvas.mockRejectedValue(new Error("QR unavailable"));
    render(<RecapShareCard {...props} />);
    await screen.findByRole("button", { name: "Export with link only" });
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Share Story" })).toBeDisabled();
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Game link")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Expand story preview" })
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).queryByLabelText("Game link")
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Export with link only" })
    );
    await waitFor(() =>
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce()
    );
    expect(context.drawImage).not.toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalledWith(
      "View game and RSVP",
      72,
      1758
    );
  });

  it("does not download an already-rendered image after its join destination changes", async () => {
    let finishExport: BlobCallback = () => {};
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(
      (callback) => {
        finishExport = callback;
      }
    );
    const { rerender } = render(<RecapShareCard {...props} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
    await waitFor(() =>
      expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalled()
    );
    rerender(
      <RecapShareCard {...props} joinUrl="https://relay.example/s/new-game" />
    );
    await act(async () =>
      finishExport(new Blob(["png"], { type: "image/png" }))
    );
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
    expect(
      screen.getByText("Join details changed. Export the current story again.")
    ).toBeVisible();
  });

  it("drops pending QR work when join details are turned Off", async () => {
    let finish = () => {};
    mocks.toCanvas.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const { container } = render(<RecapShareCard {...props} />);
    await waitFor(() => expect(mocks.toCanvas).toHaveBeenCalledOnce());
    customize();
    fireEvent.click(screen.getByRole("button", { name: "Off" }));
    await act(async () => finish());
    expect(container.querySelector('[data-story-region="join"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
  });

  it("ignores late QR completion after the destination changes and blocks until the new QR is ready", async () => {
    let resolveOld = () => {};
    let resolveNew = () => {};
    mocks.toCanvas
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveOld = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveNew = resolve;
          })
      );
    const { container, rerender } = render(<RecapShareCard {...props} />);
    await waitFor(() => expect(mocks.toCanvas).toHaveBeenCalledTimes(1));
    const nextUrl = "https://relay.example/s/new-game-456def";
    rerender(<RecapShareCard {...props} joinUrl={nextUrl} />);
    await waitFor(() => expect(mocks.toCanvas).toHaveBeenCalledTimes(2));
    await act(async () => resolveOld());
    expect(
      container.querySelector('[data-story-region="join"] image')
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    expect(
      container.querySelector('[data-story-region="join"]')
    ).toHaveAttribute("aria-label", `Game join details: ${nextUrl}`);
    await act(async () => resolveNew());
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
  });
});
