"use client";

import { useEffect, useState } from "react";
import { Socket, Channel } from "phoenix";
import { getToken } from "./auth";

let socket: Socket | null = null;

function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socket) return socket;

  const token = getToken();

  socket = new Socket(
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/socket",
    {
      params: { token }
    }
  );
  socket.connect();
  return socket;
}

export function useSocketForChat(chatId: number): Channel | null {
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const ch = s.channel(`chat:${chatId}`, {});
    ch.join().receive("error", () => {
      console.error("Failed to join chat channel");
    });
    setChannel(ch);

    return () => {
      ch.leave();
    };
  }, [chatId]);

  return channel;
}

