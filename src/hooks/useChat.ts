import { useEffect, useRef, useState, useCallback } from "react";
import { ChatSocketService } from "@/services/chat-socket.service";
import { chatService } from "@/services/chat.service";
import type { ChatMessageEvent } from "@/types/chat";

function mergeMessages(current: ChatMessageEvent[], incoming: ChatMessageEvent[]) {
  const map = new Map<string, ChatMessageEvent>();
  current.forEach((msg) => map.set(msg.messageId, msg));
  incoming.forEach((msg) => map.set(msg.messageId, msg));

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function useChat(
  contactId: string | null,
  onNewMessage?: (incoming: ChatMessageEvent) => void
) {
  const [messages, setMessages] = useState<ChatMessageEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const socketRef = useRef<ChatSocketService | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    const socket = new ChatSocketService();
    socketRef.current = socket;

    socket.connect({
      onMessage: (incoming) => {
        setMessages((prev) => mergeMessages(prev, [incoming]));
        onNewMessageRef.current?.(incoming);
      },
      onConnectionChange: (connected) => {
        setIsConnected(connected);
        if (connected) setError(null);
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Lỗi kết nối máy chủ");
      },
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const fetchHistory = useCallback(async (id: string) => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    setPage(0);

    try {
      const data = await chatService.getHistory(id, 0);
      const formatted: ChatMessageEvent[] = data.messages.map((m) => ({
        ...m,
        type: "CHAT",
      }));
      setMessages(formatted);
      setHasNext(data.hasNext);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Không thể tải lịch sử tin nhắn");
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!contactId) {
      setMessages([]);
      setHasNext(false);
      return;
    }
    fetchHistory(contactId);
  }, [contactId, fetchHistory]);

  const loadOlder = async () => {
    if (!contactId || !hasNext || isHistoryLoading) return;

    setIsHistoryLoading(true);
    try {
      const nextPage = page + 1;
      const data = await chatService.getHistory(contactId, nextPage);
      const formatted: ChatMessageEvent[] = data.messages.map((m) => ({
        ...m,
        type: "CHAT",
      }));

      setMessages((prev) => mergeMessages(prev, formatted));
      setPage(nextPage);
      setHasNext(data.hasNext);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Không thể tải thêm tin nhắn");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const sendMessage = (text: string, recipientId: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed || !recipientId || !socketRef.current) return false;

    return socketRef.current.send({
      recipientId,
      message: trimmed,
    });
  };

  return {
    messages,
    isConnected,
    error,
    sendMessage,
    loadOlder,
    isHistoryLoading,
    historyError,
    hasOlder: hasNext,
    retryHistory: () => contactId && fetchHistory(contactId),
  };
}
