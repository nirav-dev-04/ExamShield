import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "./AuthContext";
import { mockStompInstance } from "../mocks/mockStomp";

interface WebSocketContextType {
  stompClient: any | null;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

function getCookie(name: string): string | null {
  const matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : null;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stompClient, setStompClient] = useState<any | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setStompClient(null);
      setConnected(false);
      return;
    }

    if (import.meta.env.VITE_USE_MOCK === "true") {
      // Use Standalone Mock STOMP Client
      setStompClient(mockStompInstance);
      mockStompInstance.onConnect = () => setConnected(true);
      mockStompInstance.onDisconnect = () => setConnected(false);
      mockStompInstance.activate();

      return () => {
        mockStompInstance.deactivate();
      };
    } else {
      // Use Production Live STOMP Client
      const socket = new SockJS("/ws");
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") || "",
        },
        onConnect: () => {
          setConnected(true);
        },
        onDisconnect: () => {
          setConnected(false);
        },
        onStompError: (frame) => {
          console.error("STOMP connection error", frame);
        },
      });

      client.activate();
      setStompClient(client);

      return () => {
        client.deactivate();
      };
    }
  }, [user]);

  return (
    <WebSocketContext.Provider value={{ stompClient, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
