import "server-only";
import { isDeepStrictEqual } from "node:util";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  agentConversations,
  agentCreationProposals,
  agentSettings,
  groupMembers,
  groups,
  profiles,
  sessionPlayers,
  sessions,
  users,
  venues,
} from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { createGroupCommand } from "@/features/groups/create-group-command";
import { sessionAccent } from "@/features/sessions/accent";
import {
  type CreationDatabase,
  type CreationHooks,
  createSessionCommand,
} from "@/features/sessions/create-session-command";
import { readAgentSettings } from "./config";
import { applyReplaySource } from "./creation-model";
import {
  type CreationInput,
  type CreationPreparation,
  type CreationPreview,
  type CreationProposal,
  creationForm,
  creationInputSchema,
  creationPreparationSchema,
  validateCreation,
} from "./creation-schema";
import { AgentHistoryError } from "./history";
import type { AgentConfig } from "./validation";

const ownedConversation = (userId: string, id: string) =>
  and(eq(agentConversations.id, id), eq(agentConversations.userId, userId));
const replayTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Manila",
});
function ensureEnabled(
  config: Pick<
    AgentConfig,
    "enabled" | "allowGameCreation" | "allowGroupCreation"
  >,
  input: CreationInput
) {
  if (
    !config.enabled ||
    !(input.kind === "group"
      ? config.allowGroupCreation
      : config.allowGameCreation)
  )
    throw new AgentHistoryError(
      403,
      "This creation capability is currently unavailable."
    );
}

function ensureNotArchived(conversation: { archivedAt: Date | null }) {
  if (conversation.archivedAt)
    throw new AgentHistoryError(409, "Restore this chat before continuing.");
}

async function previewCreation(
  database: CreationDatabase,
  userId: string,
  raw: CreationInput
): Promise<{ input: CreationInput; preview: CreationPreview }> {
  const input = creationInputSchema.parse(raw);
  const lines: string[] = [];
  let peopleIds: string[] = [];
  if (input.kind === "game" && input.venueId) {
    const venue = await database.query.venues.findFirst({
      where: and(
        eq(venues.id, input.venueId),
        eq(venues.listingStatus, "verified")
      ),
    });
    if (!venue)
      throw new AgentHistoryError(
        400,
        "Choose an available court or enter a court name."
      );
    input.venue = venue.name;
    input.venueAddress = venue.address ?? undefined;
  }
  if (input.sourceSessionId && input.kind !== "quickPlay") {
    const source = await database.query.sessions.findFirst({
      where: and(
        eq(sessions.id, input.sourceSessionId),
        eq(sessions.hostId, userId)
      ),
    });
    if (
      source?.status !== "completed" ||
      (input.kind === "group" && source.groupId)
    )
      throw new AgentHistoryError(
        400,
        "This source game is no longer eligible. Choose another game."
      );
    lines.push(
      `${input.kind === "group" ? "Save crew from" : "Replay"}: ${source.title}`
    );
    if (input.kind === "group" || input.intent === "published") {
      const players = await database
        .select({ id: sessionPlayers.userId })
        .from(sessionPlayers)
        .where(
          and(
            eq(sessionPlayers.sessionId, source.id),
            eq(sessionPlayers.rsvp, "going")
          )
        );
      peopleIds = players.flatMap(({ id }) => (id ? [id] : []));
    }
  }
  if (input.kind === "game" && input.groupId) {
    const membership = await database.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, input.groupId),
        eq(groupMembers.userId, userId)
      ),
    });
    if (!membership)
      throw new AgentHistoryError(403, "Choose one of your available groups.");
    const group = await database.query.groups.findFirst({
      where: eq(groups.id, input.groupId),
    });
    if (!group) throw new AgentHistoryError(403, "Group unavailable.");
    lines.push(`Group: ${group.name}`);
    if (input.intent === "published")
      peopleIds = (
        await database
          .select({ id: groupMembers.userId })
          .from(groupMembers)
          .where(eq(groupMembers.groupId, input.groupId))
      ).map(({ id }) => id);
  }
  const issues = validateCreation(input);
  if (issues.length) throw new AgentHistoryError(400, issues.join(" "));
  peopleIds = [...new Set(peopleIds)].filter((id) => id !== userId).sort();
  const people = peopleIds.length
    ? await database
        .select({ id: profiles.userId, name: profiles.name })
        .from(profiles)
        .where(inArray(profiles.userId, peopleIds))
        .orderBy(asc(profiles.userId))
    : [];
  if (people.length !== peopleIds.length)
    throw new AgentHistoryError(
      409,
      "The participant list changed. Prepare a fresh preview."
    );
  if (input.kind === "game")
    lines.push(
      `${input.date}, ${input.start}–${input.end} (Philippine time)`,
      `${input.venue}${input.venueAddress ? ` · ${input.venueAddress}` : ""}`,
      `${input.capacity} players · ${input.courts} courts · ${input.hostPlaying ? "You are playing" : "You are organizing only"}`,
      `Visibility: ${input.visibility === "link" ? "Link only" : input.visibility} · ${input.requiresApproval ? "Approval required" : "No approval required"}`,
      ...(input.accentColor
        ? [`Game color: ${sessionAccent(input.accentColor).label}`]
        : []),
      `Payment: ${input.costKind === "free" ? "Free" : input.costKind === "collect" ? "Set up collection after creation" : "Decide later"}`,
      input.intent === "draft"
        ? "Save as a draft; no invitations sent."
        : `Publish game; ${people.length} player invitations.`,
      "Court booking is not confirmed.",
      ...(input.visibility === "public" && input.costKind !== "free"
        ? [
            "Public discovery starts after you set a player price or choose Free.",
          ]
        : []),
      ...(input.notes ? [`Notes: ${input.notes}`] : [])
    );
  if (input.kind === "group")
    lines.push(
      input.description || "No description",
      `${people.length + 1} ${people.length ? "members" : "member"}, including you as owner.`,
      ...(input.sourceSessionId
        ? ["The source game will be linked to this group."]
        : [])
    );
  if (input.kind === "quickPlay")
    lines.push(
      `${input.courts} courts · ${{ queue: "Paddle Stack", random: "Mix It Up", balanced: "Balanced Mix", king_of_court: "Court Climb" }[input.mode]}`,
      `Players: ${input.players?.join(", ")}`,
      "Opens local Quick Play on this device. No hosted game or invitations."
    );
  return {
    input,
    preview: {
      title: input.kind === "quickPlay" ? "Quick Play" : input.title!,
      lines,
      people,
    },
  };
}

function project(
  row: typeof agentCreationProposals.$inferSelect
): CreationProposal {
  return {
    id: row.id,
    messageId: row.messageId,
    input: row.input,
    preview: row.preview,
    destination: row.destination,
    status:
      row.status === "pending" && row.expiresAt <= new Date()
        ? "expired"
        : row.status === "pending" && row.preview.collecting
          ? "collecting"
          : (row.status as CreationProposal["status"]),
    expiresAt: row.expiresAt.toISOString(),
  };
}

export async function listCreationProposals(
  userId: string,
  conversationId: string
) {
  const conversation = await db.query.agentConversations.findFirst({
    where: ownedConversation(userId, conversationId),
  });
  if (!conversation) throw new AgentHistoryError(404, "Chat not found.");
  const rows = await db
    .select()
    .from(agentCreationProposals)
    .where(
      and(
        eq(agentCreationProposals.userId, userId),
        eq(agentCreationProposals.conversationId, conversationId),
        inArray(agentCreationProposals.status, ["pending", "completed"])
      )
    )
    .orderBy(asc(agentCreationProposals.createdAt));
  return rows.map(project);
}

export async function prepareCreation(
  userId: string,
  conversationId: string,
  messageId: string,
  requestId: string,
  raw: CreationPreparation
) {
  const supplied = creationPreparationSchema.parse(raw);
  const input = creationInputSchema.parse({
    ...supplied,
    intent: supplied.flow === "draft" ? "draft" : supplied.intent,
    interactionMode: "chat",
  });
  const { config } = await readAgentSettings();
  ensureEnabled(config, input);
  let draft = input;
  if (input.kind === "game" && input.sourceSessionId) {
    const source = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.id, input.sourceSessionId),
        eq(sessions.hostId, userId),
        eq(sessions.status, "completed")
      ),
    });
    if (!source)
      throw new AgentHistoryError(400, "Choose a completed game you hosted.");
    const membership = source.groupId
      ? await db.query.groupMembers.findFirst({
          where: and(
            eq(groupMembers.groupId, source.groupId),
            eq(groupMembers.userId, userId)
          ),
        })
      : null;
    draft = applyReplaySource(input, undefined, {
      id: source.id,
      title: source.title,
      venue: source.venueName,
      venueId: source.venueId,
      venueAddress: source.venueAddress,
      capacity: source.capacity,
      courts: source.courtCount,
      start: replayTime.format(source.startsAt),
      end: replayTime.format(source.endsAt),
      visibility: source.visibility,
      requiresApproval: source.requiresApproval,
      accentColor: sessionAccent(source.accentColor).id,
      replayGroupId: membership?.groupId,
    });
    if (supplied.visibility !== undefined)
      draft.visibility = supplied.visibility;
    if (supplied.requiresApproval !== undefined)
      draft.requiresApproval = supplied.requiresApproval;
  }
  const issues = validateCreation(draft);
  const readyForApproval = issues.length === 0;
  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .select()
      .from(agentConversations)
      .where(ownedConversation(userId, conversationId))
      .for("update");
    if (
      !conversation ||
      conversation.activeRequestId !== requestId ||
      !conversation.activeUntil ||
      conversation.activeUntil <= new Date()
    )
      throw new AgentHistoryError(409, "This turn is no longer active.");
    ensureNotArchived(conversation);
    const prepared = readyForApproval
      ? await previewCreation(tx, userId, draft)
      : creationFormDraft(draft);
    await tx
      .update(agentCreationProposals)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(agentCreationProposals.conversationId, conversationId),
          eq(agentCreationProposals.userId, userId),
          eq(agentCreationProposals.status, "pending")
        )
      );
    const [proposal] = await tx
      .insert(agentCreationProposals)
      .values({
        userId,
        conversationId,
        messageId,
        ...prepared,
        expiresAt: new Date(
          Date.now() + (readyForApproval ? 30 : 1440) * 60_000
        ),
      })
      .returning();
    return {
      status: readyForApproval ? "needs_approval" : "needs_answer",
      issues,
      title: proposal.preview.title,
      details: proposal.preview.lines,
      message: readyForApproval
        ? "All required details are ready for review. Explain the exact preview and defaults, then ask the user to press the explicit approval button. Nothing has been created; a text reply is never approval."
        : "Saved chat setup. Use the validation issues to ask exactly one missing or corrective question in your reply, retain all existing answers, and do not ask the user to open a form or panel. Nothing has been created.",
    };
  });
}

export async function cancelCreation(userId: string, id: string) {
  return db.transaction(async (tx) => {
    const original = await tx.query.agentCreationProposals.findFirst({
      where: and(
        eq(agentCreationProposals.id, id),
        eq(agentCreationProposals.userId, userId)
      ),
    });
    if (!original) throw new AgentHistoryError(404, "Action not found.");
    const [conversation] = await tx
      .select()
      .from(agentConversations)
      .where(ownedConversation(userId, original.conversationId))
      .for("update");
    if (!conversation) throw new AgentHistoryError(404, "Chat not found.");
    ensureNotArchived(conversation);
    const [proposal] = await tx
      .select()
      .from(agentCreationProposals)
      .where(
        and(
          eq(agentCreationProposals.id, id),
          eq(agentCreationProposals.userId, userId)
        )
      )
      .for("update");
    if (
      proposal?.status !== "pending" ||
      proposal.conversationId !== original.conversationId
    )
      throw new AgentHistoryError(
        409,
        "This action has already changed. Reload its status."
      );
    const [row] = await tx
      .update(agentCreationProposals)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(agentCreationProposals.id, id),
          eq(agentCreationProposals.userId, userId),
          eq(agentCreationProposals.status, "pending")
        )
      )
      .returning();
    return project(row);
  });
}

class AlreadyCreated extends Error {}
export async function confirmCreation(userId: string, id: string) {
  const actor = await requireUser();
  if (actor.id !== userId)
    throw new AgentHistoryError(403, "Account changed. Reload this chat.");
  const original = await db.query.agentCreationProposals.findFirst({
    where: and(
      eq(agentCreationProposals.id, id),
      eq(agentCreationProposals.userId, userId)
    ),
  });
  if (!original) throw new AgentHistoryError(404, "Action not found.");
  if (original.status === "completed") return project(original);
  if (original.preview.collecting)
    throw new AgentHistoryError(
      409,
      "Finish the details in chat and review them before approving."
    );
  const input = creationInputSchema.parse(original.input);
  const hooks: CreationHooks = {
    async beforeCreate(tx) {
      const [conversation] = await tx
        .select()
        .from(agentConversations)
        .where(ownedConversation(userId, original.conversationId))
        .for("update");
      if (
        !conversation ||
        (conversation.activeUntil && conversation.activeUntil > new Date())
      )
        throw new AgentHistoryError(
          409,
          "Wait for Agent to finish before confirming."
        );
      ensureNotArchived(conversation);
      const [row] = await tx
        .select()
        .from(agentCreationProposals)
        .where(
          and(
            eq(agentCreationProposals.id, id),
            eq(agentCreationProposals.userId, userId)
          )
        )
        .for("update");
      if (!row) throw new AgentHistoryError(404, "Action not found.");
      if (row.conversationId !== original.conversationId)
        throw new AgentHistoryError(
          409,
          "This action has changed. Reload its status."
        );
      if (row.status === "completed") throw new AlreadyCreated();
      if (
        row.status !== "pending" ||
        row.preview.collecting ||
        row.expiresAt <= new Date()
      )
        throw new AgentHistoryError(
          409,
          "This preview is cancelled or expired. Ask Agent for a fresh preview."
        );
      const [config] = await tx
        .select()
        .from(agentSettings)
        .where(eq(agentSettings.id, "global"))
        .for("share");
      if (!config) throw new AgentHistoryError(403, "Agent unavailable.");
      ensureEnabled(config, input);
      const account = await tx.query.users.findFirst({
        columns: { suspendedAt: true },
        where: eq(users.id, userId),
      });
      if (!account || account.suspendedAt)
        throw new AgentHistoryError(403, "Account access required.");
      const current = await previewCreation(tx, userId, input);
      if (
        !isDeepStrictEqual(JSON.parse(JSON.stringify(current)), {
          input: row.input,
          preview: row.preview,
        })
      )
        throw new AgentHistoryError(
          409,
          "The game, court or member list changed. Ask Agent for a fresh preview."
        );
    },
    async afterCreate(tx, destination) {
      await tx
        .update(agentCreationProposals)
        .set({ status: "completed", destination, updatedAt: new Date() })
        .where(
          and(
            eq(agentCreationProposals.id, id),
            eq(agentCreationProposals.userId, userId)
          )
        );
    },
  };
  try {
    if (input.kind === "quickPlay") {
      await db.transaction(async (tx) => {
        await hooks.beforeCreate(tx);
        await hooks.afterCreate(tx, "/play");
      });
    } else {
      const form = creationForm(input, id);
      const result =
        input.kind === "group"
          ? await createGroupCommand(actor, form, hooks)
          : await createSessionCommand(actor, form, hooks);
      if (result.error) throw new AgentHistoryError(400, result.error);
    }
  } catch (error) {
    if (!(error instanceof AlreadyCreated)) {
      // The domain write may have committed before a post-commit side effect failed.
      const saved = await db.query.agentCreationProposals.findFirst({
        where: and(
          eq(agentCreationProposals.id, id),
          eq(agentCreationProposals.userId, userId)
        ),
      });
      if (saved?.status !== "completed") throw error;
    }
  }
  const saved = await db.query.agentCreationProposals.findFirst({
    where: and(
      eq(agentCreationProposals.id, id),
      eq(agentCreationProposals.userId, userId)
    ),
  });
  if (!saved) throw new AgentHistoryError(404, "Action unavailable.");
  return project(saved);
}

export async function creationOptions(
  userId: string,
  includeCourts = false,
  groupReference?: string,
  courtReference?: string
) {
  const reference = groupReference?.trim();
  const groupFilter = reference
    ? creationInputSchema.shape.groupId.safeParse(reference).success
      ? eq(groups.id, reference)
      : eq(groups.slug, reference)
    : undefined;
  const court = courtReference?.trim();
  const courtFilter = court
    ? creationInputSchema.shape.venueId.safeParse(court).success
      ? eq(venues.id, court)
      : eq(venues.slug, court)
    : undefined;
  const groupRows = await db
    .select({ id: groups.id, name: groups.name, slug: groups.slug })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(and(eq(groupMembers.userId, userId), groupFilter))
    .orderBy(asc(groups.name), asc(groups.id))
    .limit(30);
  const games = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      status: sessions.status,
      groupId: sessions.groupId,
      replayGroupId: groupMembers.groupId,
      venue: sessions.venueName,
      venueId: sessions.venueId,
      venueAddress: sessions.venueAddress,
      capacity: sessions.capacity,
      courts: sessions.courtCount,
      startsAt: sessions.startsAt,
      endsAt: sessions.endsAt,
      visibility: sessions.visibility,
      requiresApproval: sessions.requiresApproval,
      accentColor: sessions.accentColor,
    })
    .from(sessions)
    .leftJoin(
      groupMembers,
      and(
        eq(groupMembers.groupId, sessions.groupId),
        eq(groupMembers.userId, userId)
      )
    )
    .where(eq(sessions.hostId, userId))
    .orderBy(desc(sessions.createdAt), desc(sessions.id))
    .limit(30);
  return {
    courts: includeCourts
      ? await db
          .select({
            id: venues.id,
            name: venues.name,
            slug: venues.slug,
            address: venues.address,
          })
          .from(venues)
          .where(and(eq(venues.listingStatus, "verified"), courtFilter))
          .orderBy(asc(venues.name), asc(venues.id))
          .limit(100)
      : [],
    groups: groupRows,
    hostedGames: games.map(({ startsAt, endsAt, accentColor, ...game }) => ({
      ...game,
      start: replayTime.format(startsAt),
      end: replayTime.format(endsAt),
      accentColor: sessionAccent(accentColor).id,
    })),
    note: "Up to 30 groups/games and 100 courts. Resolve off-list groups with groupReference using an exact /groups/<slug> slug or ID; membership is always required. Resolve off-list courts with courtReference using an exact court slug or ID; only verified courts are returned when court search is enabled. Replay requires completed status. Saving a crew requires completed status and no existing group. Ask for a game URL if the target is absent.",
  };
}

function creationFormDraft(raw: CreationInput) {
  const input = creationInputSchema.parse({ ...raw, interactionMode: "chat" });
  return {
    input,
    preview: {
      collecting: true,
      title:
        input.title ||
        (input.kind === "quickPlay"
          ? "Quick Play"
          : input.kind === "group"
            ? "Create group"
            : "Create game"),
      lines: [
        "Answer one question at a time in chat, then review and approve. Nothing has been created.",
      ],
      people: [],
    } satisfies CreationPreview,
  };
}

export async function startCreationForm(
  userId: string,
  conversationId: string,
  input: CreationInput
) {
  const { config } = await readAgentSettings();
  ensureEnabled(config, input);
  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .select()
      .from(agentConversations)
      .where(ownedConversation(userId, conversationId))
      .for("update");
    if (!conversation) throw new AgentHistoryError(404, "Chat not found.");
    ensureNotArchived(conversation);
    if (conversation.activeUntil && conversation.activeUntil > new Date())
      throw new AgentHistoryError(409, "Wait for the current reply to finish.");
    await tx
      .update(agentCreationProposals)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(agentCreationProposals.userId, userId),
          eq(agentCreationProposals.conversationId, conversationId),
          eq(agentCreationProposals.status, "pending")
        )
      );
    const [row] = await tx
      .insert(agentCreationProposals)
      .values({
        userId,
        conversationId,
        messageId: crypto.randomUUID(),
        ...creationFormDraft(input),
        expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
      })
      .returning();
    return project(row);
  });
}

export async function updateCreationForm(
  userId: string,
  id: string,
  input: CreationInput,
  review: boolean,
  requestId = crypto.randomUUID()
) {
  const { config } = await readAgentSettings();
  ensureEnabled(config, input);
  return db.transaction(async (tx) => {
    const reference = await tx.query.agentCreationProposals.findFirst({
      where: and(
        eq(agentCreationProposals.id, id),
        eq(agentCreationProposals.userId, userId)
      ),
    });
    if (!reference)
      throw new AgentHistoryError(
        409,
        "This setup is no longer active. Start a new creation request in chat."
      );
    const [conversation] = await tx
      .select()
      .from(agentConversations)
      .where(ownedConversation(userId, reference.conversationId))
      .for("update");
    const [original] = await tx
      .select()
      .from(agentCreationProposals)
      .where(
        and(
          eq(agentCreationProposals.id, id),
          eq(agentCreationProposals.userId, userId)
        )
      )
      .for("update");
    if (original?.conversationId !== reference.conversationId)
      throw new AgentHistoryError(
        409,
        "This setup has changed. Reload its status."
      );
    if (
      !conversation ||
      (conversation.activeUntil && conversation.activeUntil > new Date())
    )
      throw new AgentHistoryError(409, "Wait for the current reply to finish.");
    ensureNotArchived(conversation);
    if (
      original?.status === "cancelled" &&
      original.preview.replacement?.requestId === requestId
    ) {
      const replacement = await tx.query.agentCreationProposals.findFirst({
        where: and(
          eq(agentCreationProposals.id, original.preview.replacement.id),
          eq(agentCreationProposals.userId, userId)
        ),
      });
      if (replacement) return project(replacement);
    }
    if (original?.status !== "pending")
      throw new AgentHistoryError(
        409,
        "This setup is no longer active. Start a new creation request in chat."
      );
    if (input.kind !== original.input.kind)
      throw new AgentHistoryError(
        400,
        "Start a separate creation request for a different action."
      );
    const prepared = review
      ? await previewCreation(tx, userId, input)
      : creationFormDraft(input);
    // Approved payloads always have a new identity. An older tab cannot approve edited details.
    if (review || !original.preview.collecting) {
      const [row] = await tx
        .insert(agentCreationProposals)
        .values({
          userId,
          conversationId: original.conversationId,
          messageId: original.messageId,
          ...prepared,
          expiresAt: new Date(Date.now() + (review ? 30 : 1440) * 60_000),
        })
        .returning();
      await tx
        .update(agentCreationProposals)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
          preview: {
            ...original.preview,
            replacement: { id: row.id, requestId },
          },
        })
        .where(eq(agentCreationProposals.id, id));
      return project(row);
    }
    const [row] = await tx
      .update(agentCreationProposals)
      .set({
        ...prepared,
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
      })
      .where(eq(agentCreationProposals.id, id))
      .returning();
    return project(row);
  });
}
