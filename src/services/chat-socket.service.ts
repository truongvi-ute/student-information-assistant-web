import SockJS from "sockjs-client";
import { Client, type StompSubscription } from "@stomp/stompjs";
import type {
  ChatErrorEvent,
  ChatMessageEvent,
  ChatReadReceiptEvent,
  ChatSocketHandlers,
  SendChatMessageRequest,
} from "@/types/chat";
import { authStorage } from "@/utils/auth-storage";

function resolveWebSocketUrl(): string {
  const configuredWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (configuredWsUrl && configuredWsUrl.trim()) {
    return configuredWsUrl.trim();
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
  return `${apiBase.replace(/\/api\/?$/, "")}/chat-websocket`;
}

function mapStompErrorMessage(rawMessage?: string): string {
  const trimmed = rawMessage?.trim();
  if (!trimmed) {
    return "Lỗi kết nối máy chủ trò chuyện";
  }
  if (trimmed.includes("Invalid bearer token") || trimmed.includes("Missing bearer token")) {
    return "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
  }
  if (trimmed.includes("Account is blocked")) {
    return "Tài khoản của bạn đã bị khóa.";
  }
  if (trimmed.includes("Password change is required")) {
    return "Vui lòng đổi mật khẩu trước khi sử dụng tính năng trò chuyện.";
  }
  return trimmed;
}

export class ChatSocketService {
  private client: Client | null = null;
  private subscriptions: StompSubscription[] = [];
  private hasConnectedOnce = false;
  private isDisconnecting = false;

  connect(handlers: ChatSocketHandlers, options?: { isReconnect?: boolean }): void {
    const token = authStorage.getToken();
    if (!token) {
      handlers.onConnectionChange(false, {
        isReconnect: options?.isReconnect ?? false,
        permanent: true,
      });
      handlers.onError?.(new Error("Bạn cần đăng nhập để chat."));
      return;
    }

    this.clearSubscriptions();
    if (this.client) {
      void this.client.deactivate();
      this.client = null;
    }

    this.hasConnectedOnce = options?.isReconnect ?? false;
    this.isDisconnecting = false;

    const wsUrl = resolveWebSocketUrl();
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 3000,
      debug: () => {},
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      beforeConnect: (stompClient) => {
        const freshToken = authStorage.getToken();
        if (!freshToken) {
          this.isDisconnecting = true;
          handlers.onConnectionChange(false, {
            isReconnect: this.hasConnectedOnce,
            permanent: true,
          });
          handlers.onError?.(new Error("Phiên đăng nhập đã hết hạn."));
          void stompClient.deactivate();
          return;
        }
        stompClient.connectHeaders = {
          Authorization: `Bearer ${freshToken}`,
        };
      },
      onConnect: () => {
        if (this.client !== client) return;

        this.clearSubscriptions();

        this.subscriptions.push(
          client.subscribe("/user/queue/messages", (frame) => {
            try {
              const message = JSON.parse(frame.body) as ChatMessageEvent;
              handlers.onMessage(message);
            } catch (error) {
              handlers.onError?.(error);
            }
          }),
          client.subscribe("/user/queue/read-receipts", (frame) => {
            try {
              const receipt = JSON.parse(frame.body) as ChatReadReceiptEvent;
              handlers.onReadReceipt?.(receipt);
            } catch (error) {
              handlers.onError?.(error);
            }
          }),
          client.subscribe("/user/queue/errors", (frame) => {
            try {
              const serverError = JSON.parse(frame.body) as ChatErrorEvent;
              handlers.onServerError?.(serverError);
            } catch (error) {
              handlers.onError?.(error);
            }
          }),
        );

        const isReconnect = this.hasConnectedOnce;
        this.hasConnectedOnce = true;
        handlers.onConnectionChange(true, { isReconnect });
      },
      onStompError: (frame) => {
        if (this.isDisconnecting || this.client !== client) return;
        this.isDisconnecting = true;
        this.clearSubscriptions();
        this.client = null;
        void client.deactivate();
        const friendlyMessage = mapStompErrorMessage(frame.headers?.message);
        handlers.onConnectionChange(false, {
          isReconnect: this.hasConnectedOnce,
          permanent: true,
        });
        handlers.onError?.(new Error(friendlyMessage));
      },
      onWebSocketClose: () => {
        if (this.isDisconnecting || this.client !== client) return;
        handlers.onConnectionChange(false, { isReconnect: this.hasConnectedOnce });
      },
      onWebSocketError: () => {
        if (this.isDisconnecting || this.client !== client) return;
        handlers.onConnectionChange(false, { isReconnect: this.hasConnectedOnce });
      },
    });

    this.client = client;
    client.activate();
  }

  reconnect(handlers: ChatSocketHandlers): void {
    this.disconnect();
    this.connect(handlers, { isReconnect: true });
  }

  send(message: SendChatMessageRequest): boolean {
    if (!this.client?.connected) return false;

    this.client.publish({
      destination: "/app/sendMessage",
      body: JSON.stringify(message),
    });

    return true;
  }

  disconnect(): void {
    this.isDisconnecting = true;
    this.clearSubscriptions();
    const client = this.client;
    this.client = null;
    if (client) {
      void client.deactivate();
    }
  }

  private clearSubscriptions(): void {
    for (const sub of this.subscriptions) {
      try {
        sub.unsubscribe();
      } catch {
      }
    }
    this.subscriptions = [];
  }
}
