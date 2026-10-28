import SockJS from "sockjs-client";
import { Stomp, type CompatClient } from "@stomp/stompjs";
import type {
    ChatMessageEvent,
    ChatSocketHandlers,
    SendChatMessageRequest,
} from "@/types/chat";
import { authStorage } from "@/utils/auth-storage";

export class ChatSocketService {
    private client: CompatClient | null = null;

    connect(handlers: ChatSocketHandlers): void {
        const token = authStorage.getToken();
        if (!token) {
            handlers.onError?.(new Error("Bạn cần đăng nhập để chat."));
            return;
        }
        const headers = {
            Authorization: `Bearer ${token}`,
        };

        const client = Stomp.over(
            () => new SockJS("http://localhost:8080/chat-websocket"),
        );

        this.client = client;

        client.onWebSocketClose = () => {
            handlers.onConnectionChange(false);
        };

        client.connect(
            headers,
            () => {
                handlers.onConnectionChange(true);

                client.subscribe("/user/queue/messages", (frame) => {
                    try {
                        const message = JSON.parse(frame.body) as ChatMessageEvent;
                        handlers.onMessage(message);
                    } catch (error) {
                        handlers.onError?.(error);
                    }
                });
            },
            (error: any) => {
                handlers.onConnectionChange(false);
                handlers.onError?.(error);
            },
        );
    }

    send(message: SendChatMessageRequest): boolean {
        if (!this.client?.connected) return false;

        this.client.send(
            "/app/sendMessage",
            {},
            JSON.stringify(message),
        );

        return true;
    }

    disconnect(): void {
        const client = this.client;
        this.client = null;
        client?.disconnect();
    }
}
