import { useEffect, useState } from "react";
import { chatService } from "@/services/chat.service";
import type { ChatContact, ChatConversationItem, ChatMessageEvent } from "@/types/chat";

export function useChatConversations(enabled = true) {
  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    chatService
      .getConversations()
      .then((data) => {
        if (isMounted) {
          setConversations(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không tải được danh sách hội thoại");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  const refreshConversations = () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    chatService
      .getConversations()
      .then((data) => {
        setConversations(data);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Không tải được danh sách hội thoại");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const updateOnNewMessage = (
    incoming: ChatMessageEvent,
    currentUserId: string,
    activeContact: ChatContact | null
  ) => {
    const partnerId =
      incoming.senderId === currentUserId
        ? incoming.recipientId
        : incoming.senderId;

    setConversations((prev) => {
      const index = prev.findIndex((c) => c.partnerId === partnerId);
      if (index >= 0) {
        const existing = prev[index];
        const updated: ChatConversationItem = {
          ...existing,
          lastMessage: incoming.message,
          lastMessageAt: incoming.createdAt,
        };
        const nextList = [...prev];
        nextList.splice(index, 1);
        nextList.unshift(updated);
        return nextList;
      }

      if (activeContact && activeContact.accountId === partnerId) {
        const newItem: ChatConversationItem = {
          conversationId: incoming.messageId,
          partnerId: activeContact.accountId,
          partnerName: activeContact.fullName,
          partnerRole: activeContact.role,
          partnerDepartment: activeContact.departmentName || activeContact.department,
          lastMessage: incoming.message,
          lastMessageAt: incoming.createdAt,
        };
        return [newItem, ...prev];
      }

      return prev;
    });
  };

  return {
    conversations,
    isLoading,
    error,
    refreshConversations,
    updateOnNewMessage,
  };
}
