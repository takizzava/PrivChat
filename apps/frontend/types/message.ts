export type Message = {
  id?: number;
  localId?: string;
  chat_id: number;
  sender_id: number;
  body: string;
  inserted_at: string;
  encrypted: boolean;
  envelope_metadata: Record<string, unknown>;
  status?: "sending" | "sent" | "failed" | "delivered" | "read";
};
