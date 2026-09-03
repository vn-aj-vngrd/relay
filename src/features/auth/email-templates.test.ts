import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const templates = {
  "confirmation.html": "{{ .ConfirmationURL }}",
  "email-change.html": "{{ .ConfirmationURL }}",
  "invite.html": "{{ .ConfirmationURL }}",
  "magic-link.html": "{{ .ConfirmationURL }}",
  "password-changed.html": "https://relay.vanajvanguardia.tech/login",
  "reauthentication.html": "{{ .Token }}",
  "recovery.html": "{{ .ConfirmationURL }}",
};

function template(name: string) {
  return readFileSync(
    join(process.cwd(), "supabase", "templates", name),
    "utf8"
  );
}

describe("Supabase Auth email templates", () => {
  it.each(Object.entries(templates))(
    "keeps %s branded and preserves its required destination",
    (name, required) => {
      const html = template(name);

      expect(html).toContain("Relay");
      expect(html).toContain(required);
      expect(html).toContain("Plan the game. Share the link. Play.");
      expect(html).not.toMatch(/powered by supabase/i);
    }
  );

  it("registers every committed template in the Supabase Auth configuration", () => {
    const config = readFileSync(
      join(process.cwd(), "supabase", "config.toml"),
      "utf8"
    );

    for (const name of Object.keys(templates)) expect(config).toContain(name);
  });
});
