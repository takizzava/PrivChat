export type Chat = {
  id: number;
  name: string;
  owner_id?: number;
  inserted_at: string;
  kind?: "direct" | "group";
  member_ids?: number[];
};
