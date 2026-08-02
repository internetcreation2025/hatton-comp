# Database migrations

These were applied to the Supabase project **HattComp** (`hijrblbefgpxdkdzcvvj`)
via the Supabase MCP tools, in this order:

1. `hatton_padel_initial_schema` — members, games, game_players, game_events,
   push_subscriptions; the capacity trigger; the status-sync trigger; RLS on
   with no policies.
2. `add_reminder_sent_at_to_games` — so the pre-match reminder can only ever go
   out once per game.
3. `lock_down_trigger_functions` — revoke EXECUTE on the two trigger functions
   from `anon` and `authenticated`, so they aren't listed as public RPC
   endpoints.

The full SQL for each is in the project's migration history in the Supabase
dashboard: Database → Migrations.
