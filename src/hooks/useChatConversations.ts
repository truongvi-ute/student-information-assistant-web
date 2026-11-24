import { useCallback, useEffect, useRef, useState } from "react";
import { chatService } from "@/services/chat.service";
import type {
  ChatContact,
  ChatConversationItem,
  ChatMessageEvent,
  ChatReadReceiptEvent,
} from "@/types/chat";
import { maxIsoTimestamp } from "@/utils/client-message-id";

const MAX_TRACKED_MESSAGE_IDS = 500;

export function useChatConversations(enabled = true) {
  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversationsRef = useRef<ChatConversationItem[]>([]);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    chatService
      .getConversations()
      .then((data) => {
        if (isMounted) {
          setConversations(data);
          setError(null);
          setHasLoadedOnce(true);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không tải được danh sách hội thoại");
          setHasLoadedOnce(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  const refreshConversations = useCallback(
    (options?: { silent?: boolean }) => {
      if (!enabled) return;
      const silent = options?.silent ?? false;
      if (!silent) {
        setIsRefreshing(true);
      }
      setError(null);
      chatService
        .getConversations()
        .then((data) => {
          setConversations(data);
        })
        .catch((err: unknown) => {
          if (!silent) {
            setError(err instanceof Error ? err.message : "Không tải được danh sách hội thoại");
          }
        })
        .finally(() => {
          setHasLoadedOnce(true);
          if (!silent) {
            setIsRefreshing(false);
          }
        });
    },
    [enabled],
  );

  const trackMessageId = useCallback((messageId?: string | null): boolean => {
    if (!messageId) return true;
    const seen = seenMessageIdsRef.current;
    if (seen.has(messageId)) {
      return false;
    }
    if (seen.size >= MAX_TRACKED_MESSAGE_IDS) {
      const oldest = seen.values().next().value;
      if (oldest) seen.delete(oldest);
    }
    seen.add(messageId);
    return true;
  }, []);

  const updateOnNewMessage = useCallback(
    (
      incoming: ChatMessageEvent,
      currentUserId: string,
      activeContact: ChatContact | null,
      isTabVisible = true,
    ): boolean => {
      if (incoming.type && incoming.type !== "CHAT") return false;

      const partnerId =
        incoming.senderId === currentUserId
          ? incoming.recipientId
          : incoming.senderId;
      const isPartnerMessage = incoming.senderId !== currentUserId;
      const isActivelyViewing = Boolean(
        activeContact && activeContact.accountId === partnerId && isTabVisible,
      );
      const isNewMessage = trackMessageId(incoming.messageId);
      const knownInList = conversationsRef.current.some((c) => c.partnerId === partnerId);

      setConversations((prev) => {
        const index = prev.findIndex((c) => c.partnerId === partnerId);
        if (index >= 0) {
          const existing = prev[index];
          const prevUnread = existing.unreadCount ?? 0;
          let nextUnread = prevUnread;
          if (isActivelyViewing) {
            nextUnread = 0;
          } else if (isPartnerMessage && isNewMessage) {
            nextUnread = prevUnread + 1;
          }

          const nextConversationId = incoming.conversationId || existing.conversationId;
          const incomingTs = Date.parse(incoming.createdAt);
          const existingTs = existing.lastMessageAt
            ? Date.parse(existing.lastMessageAt)
            : Number.NEGATIVE_INFINITY;
          const isNewerOrEqual =
            Number.isNaN(existingTs) || (!Number.isNaN(incomingTs) && incomingTs >= existingTs);

          if (!isNewerOrEqual) {
            if (nextUnread === prevUnread && nextConversationId === existing.conversationId) {
              return prev;
            }
            const nextList = [...prev];
            nextList[index] = {
              ...existing,
              conversationId: nextConversationId,
              unreadCount: nextUnread,
            };
            return nextList;
          }

          if (
            index === 0 &&
            nextUnread === prevUnread &&
            nextConversationId === existing.conversationId &&
            existing.lastMessage === incoming.message &&
            existing.lastMessageAt === incoming.createdAt
          ) {
            return prev;
          }

          const updated: ChatConversationItem = {
            ...existing,
            conversationId: nextConversationId,
            lastMessage: incoming.message,
            lastMessageAt: incoming.createdAt,
            unreadCount: nextUnread,
          };
          const nextList = [...prev];
          if (index === 0) {
            nextList[0] = updated;
          } else {
            nextList.splice(index, 1);
            nextList.unshift(updated);
          }
          return nextList;
        }

        if (activeContact && activeContact.accountId === partnerId) {
          const newItem: ChatConversationItem = {
            conversationId: incoming.conversationId || incoming.messageId,
            partnerId: activeContact.accountId,
            partnerName: activeContact.fullName,
            partnerRole: activeContact.role,
            partnerDepartment: activeContact.departmentName || activeContact.department,
            lastMessage: incoming.message,
            lastMessageAt: incoming.createdAt,
            unreadCount: isPartnerMessage && !isActivelyViewing ? 1 : 0,
            partnerLastReadAt: null,
          };
          return [newItem, ...prev];
        }

        return prev;
      });

      if (!knownInList && (!activeContact || activeContact.accountId !== partnerId)) {
        refreshConversations({ silent: true });
      }

      return isNewMessage;
    },
    [refreshConversations, trackMessageId],
  );

  const applyReadReceipt = useCallback(
    (receipt: ChatReadReceiptEvent, currentUserId: string) => {
      const targetPartnerId =
        receipt.readerId === currentUserId ? receipt.partnerId : receipt.readerId;

      setConversations((prev) => {
        let changed = false;
        const next = prev.map((item) => {
          const matches =
            item.conversationId === receipt.conversationId ||
            item.partnerId === targetPartnerId;
          if (!matches) return item;

          const nextConversationId = receipt.conversationId || item.conversationId;

          if (receipt.readerId === currentUserId) {
            const receiptTs = Date.parse(receipt.lastReadAt);
            const lastMsgTs = item.lastMessageAt ? Date.parse(item.lastMessageAt) : 0;
            const shouldClearUnread =
              (item.unreadCount ?? 0) > 0 &&
              (!item.lastMessageAt || (!Number.isNaN(receiptTs) && receiptTs >= lastMsgTs));

            if (!shouldClearUnread && nextConversationId === item.conversationId) {
              return item;
            }

            changed = true;
            return {
              ...item,
              conversationId: nextConversationId,
              unreadCount: shouldClearUnread ? 0 : item.unreadCount,
            };
          }

          const nextPartnerReadAt = maxIsoTimestamp(item.partnerLastReadAt, receipt.lastReadAt);
          if (
            nextPartnerReadAt === item.partnerLastReadAt &&
            nextConversationId === item.conversationId
          ) {
            return item;
          }

          changed = true;
          return {
            ...item,
            conversationId: nextConversationId,
            partnerLastReadAt: nextPartnerReadAt,
          };
        });

        return changed ? next : prev;
      });
    },
    [],
  );

  const markLocalConversationRead = useCallback((partnerId: string) => {
    setConversations((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (item.partnerId === partnerId && (item.unreadCount ?? 0) !== 0) {
          changed = true;
          return { ...item, unreadCount: 0 };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, []);

  const isLoading = enabled && (!hasLoadedOnce || isRefreshing);

  return {
    conversations,
    isLoading,
    error,
    refreshConversations,
    updateOnNewMessage,
    applyReadReceipt,
    markLocalConversationRead,
  };
}
