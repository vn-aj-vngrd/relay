ALTER TABLE agent_settings ADD COLUMN allow_game_creation boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE agent_settings ADD COLUMN allow_group_creation boolean NOT NULL DEFAULT false;
--> statement-breakpoint
CREATE TABLE agent_creation_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL CONSTRAINT agent_creation_proposals_user_id_users_id_fk REFERENCES users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL CONSTRAINT agent_creation_proposals_conversation_id_agent_conversations_id_fk REFERENCES agent_conversations(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  input jsonb NOT NULL,
  preview jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CONSTRAINT agent_creation_status CHECK (status IN ('pending', 'completed', 'cancelled')),
  destination text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX agent_creation_conversation_idx ON agent_creation_proposals(conversation_id, created_at);
--> statement-breakpoint
ALTER TABLE agent_creation_proposals ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE agent_creation_proposals FROM PUBLIC, anon, authenticated, service_role;
