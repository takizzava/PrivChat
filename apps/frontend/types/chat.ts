export type Chat = {
  id: number;
  name: string;
  owner_id?: number;
  inserted_at: string;
  updated_at?: string;
  kind?: "direct" | "group";
  member_ids?: number[];
  members?: ChatMember[];
};

export type ChatMember = {
  id: number;
  username?: string;
  display_name?: string;
  phone?: string;
};
