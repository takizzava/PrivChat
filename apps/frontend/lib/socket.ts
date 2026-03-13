"use client";

import { useEffect, useState } from "react";
import { Socket, Channel } from "phoenix";

let socket: Socket | null = null;
let socketToken: string | null = null;

function createSocket(token: string) {
  const url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/socket";
  const s = new Socket(url, {
    params: { token }
  });
  s.connect();
  return s;
}

function getSocket(token: string | null) {
  if (typeof window === "undefined") return null;
  if (!token) {
    socketToken = null;
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket && socketToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socketToken = token;
  socket = createSocket(token);
  return socket;
}

export function useSocketForChat(chatId: number, token: string | null): Channel | null {
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!token) {
      setChannel(null);
      return;
    }

    const s = getSocket(token);
    if (!s) {
      setChannel(null);
      return;
    }

    const ch = s.channel(`chat:${chatId}`, {});
    ch.join().receive("error", () => {
      console.error("Failed to join chat channel");
    });
    setChannel(ch);

    return () => {
      ch.leave();
    };
  }, [chatId, token]);

  return channel;
}
