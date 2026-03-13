export type Message = {
  id?: number;
  localId?: string;
  chat_id: number;
  sender_id: number;
  body: string;
  inserted_at: string;
  encrypted: boolean;
  edited_at?: string;
  reactions?: Record<string, number[]>;
  forwarded_from_id?: number;
  envelope_metadata: {
    iv?: string;
    key_fingerprint?: string;
    attachments?: Array<{
      name: string;
      size: number;
      type?: string;
      url?: string;
      iv?: string;
      key_fingerprint?: string;
      encrypted?: boolean;
      original_type?: string;
      preview_url?: string;
    }>;
    [key: string]: any;
  };
  status?: "sending" | "sent" | "failed" | "delivered" | "read";
};
