export type Member = {
  id: string;
  display_name: string;
  colour: string;
  is_admin: boolean;
  /** Optional mobile number, for the players directory. */
  phone: string | null;
  created_at: string;
  last_seen_at: string;
};

export type GameStatus = "open" | "full" | "cancelled";

export type Game = {
  id: string;
  starts_at: string;
  ends_at: string;
  venue: string;
  court: string | null;
  capacity: number;
  notes: string | null;
  status: GameStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
};

export type GamePlayer = {
  id: string;
  game_id: string;
  member_id: string | null;
  guest_name: string | null;
  status: "playing" | "waitlist";
  position: number;
  added_by: string;
  joined_at: string;
};

export type GameEventType =
  | "created"
  | "joined"
  | "left"
  | "edited"
  | "cancelled"
  | "guest_added"
  | "guest_removed"
  | "promoted";

export type GameEvent = {
  id: string;
  game_id: string;
  actor_member_id: string | null;
  type: GameEventType;
  detail: string | null;
  created_at: string;
};

/** A player row with the member's name already resolved. */
export type ResolvedPlayer = GamePlayer & {
  name: string;
  colour: string;
  isGuest: boolean;
};

/** Everything a game card or game page needs, in one object. */
export type GameWithPlayers = Game & {
  players: ResolvedPlayer[];
  waitlist: ResolvedPlayer[];
  spotsLeft: number;
};
