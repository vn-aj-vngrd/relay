import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("@/features/analytics/actions", () => ({ trackSharedSessionEvent: vi.fn(async () => undefined) }));

afterEach(() => cleanup());
