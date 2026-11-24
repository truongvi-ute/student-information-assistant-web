import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChatViewSocketListener } from "@/contexts/ConsultationContext";
import { chatService } from "@/services/chat.service";
import type {
  ChatConnectionStatus,
  ChatHistoryResponse,
  ChatUiMessage,
  SendChatMessageRequest,
} from "@/types/chat";
import { generateClientMessageId, maxIsoTimestamp } from "@/utils/client-message-id";

const ACK_TIMEOUT_MS = 10_000;

export type UseChatOptions = {
  currentUserId: string;
  contactId: string | null;
  initialPartnerLastReadAt?: string | null;
  hasUnread?: boolean;
  isTabVisible?: boolean;
  connectionStatus: ChatConnectionStatus;
  socketError: string | null;
  sendSocketMessage: (message: SendChatMessageRequest) => boolean;
  reconnectSocket: () => void;
  subscribeSocketEvents: (listener: ChatViewSocketListener) => () => void;
  onMarkedRead?: (partnerId: string, lastReadAt: string | null) => void;
};

function isConversationBetween(msg: ChatUiMessage, userA: string, userB: string): boolean {
  return (
    (msg.senderId === userA && msg.recipientId === userB) ||
    (msg.senderId === userB && msg.recipientId === userA)
  );
}

function mergeMessages(current: ChatUiMessage[], incoming: ChatUiMessage[]): ChatUiMessage[] {
  const merged = [...current];

  for (const msg of incoming) {
    const normalized: ChatUiMessage = {
      ...msg,
      deliveryStatus: msg.deliveryStatus ?? "sent",
      errorMessage: msg.errorMessage ?? null,
    };

    const existingIdx = merged.findIndex(
      (item) =>
        item.messageId === normalized.messageId ||
        (Boolean(normalized.clientMessageId) &&
          item.clientMessageId === normalized.clientMessageId &&
          item.senderId === normalized.senderId),
    );

    if (existingIdx >= 0) {
      merged[existingIdx] = normalized;
    } else {
      merged.push(normalized);
    }
  }

  return merged
    .map((item, idx) => ({ item, idx, ts: Date.parse(item.createdAt) }))
    .sort((a, b) => {
      const timeDiff = a.ts - b.ts;
      if (!Number.isNaN(timeDiff) && timeDiff !== 0) {
        return timeDiff;
      }
      return a.idx - b.idx;
    })
    .map(({ item }) => item);
}

export function useChat({
  currentUserId,
  contactId,
  initialPartnerLastReadAt = null,
  hasUnread = false,
  isTabVisible = true,
  connectionStatus,
  socketError,
  sendSocketMessage,
  reconnectSocket,
  subscribeSocketEvents,
  onMarkedRead,
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const [loadedContactId, setLoadedContactId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [historyErrorState, setHistoryErrorState] = useState<{
    contactId: string;
    message: string;
  } | null>(null);
  const [partnerReadAtByContact, setPartnerReadAtByContact] = useState<
    Record<string, string | null>
  >({});

  const pendingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const historyRequestSeqRef = useRef(0);

  const currentUserIdRef = useRef(currentUserId);
  const activeContactIdRef = useRef(contactId);
  const myLastReadAtByContactRef = useRef<Map<string, string | null>>(new Map());
  const inFlightReadAtByContactRef = useRef<Map<string, string | null>>(new Map());

  const onMarkedReadRef = useRef(onMarkedRead);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
    activeContactIdRef.current = contactId;
    onMarkedReadRef.current = onMarkedRead;
  });

  const clearAckTimer = useCallback((clientMessageId?: string | null) => {
    if (!clientMessageId) return;
    const existingTimer = pendingTimersRef.current.get(clientMessageId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      pendingTimersRef.current.delete(clientMessageId);
    }
  }, []);

  const scheduleAckTimeout = useCallback(
    (clientMessageId: string) => {
      clearAckTimer(clientMessageId);
      const timer = setTimeout(() => {
        pendingTimersRef.current.delete(clientMessageId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.clientMessageId === clientMessageId && msg.deliveryStatus === "sending"
              ? {
                  ...msg,
                  deliveryStatus: "failed",
                  errorMessage: "Quá thời gian chờ phản hồi từ máy chủ.",
                }
              : msg,
          ),
        );
      }, ACK_TIMEOUT_MS);
      pendingTimersRef.current.set(clientMessageId, timer);
    },
    [clearAckTimer],
  );

  const applyHistoryResult = useCallback(
    (targetContactId: string, data: ChatHistoryResponse, silent: boolean) => {
      const formatted: ChatUiMessage[] = data.messages.map((m) => ({
        ...m,
        conversationId: m.conversationId ?? data.conversationId ?? null,
        type: "CHAT",
        deliveryStatus: "sent",
        errorMessage: null,
      }));

      const me = currentUserIdRef.current;
      setMessages((prev) => {
        const otherMessages = prev.filter(
          (m) =>
            !isConversationBetween(m, me, targetContactId) &&
            m.deliveryStatus &&
            m.deliveryStatus !== "sent",
        );
        const existingForContact = prev.filter((m) => {
          if (!isConversationBetween(m, me, targetContactId)) return false;
          if (silent) return true;
          return Boolean(m.deliveryStatus && m.deliveryStatus !== "sent");
        });
        const mergedContact = mergeMessages(existingForContact, formatted);
        return mergeMessages(otherMessages, mergedContact);
      });

      for (const msg of formatted) {
        if (msg.clientMessageId) {
          clearAckTimer(msg.clientMessageId);
        }
      }

      if (data.partnerLastReadAt) {
        setPartnerReadAtByContact((prev) => {
          const nextReadAt = maxIsoTimestamp(prev[targetContactId], data.partnerLastReadAt);
          if (nextReadAt === (prev[targetContactId] ?? null)) {
            return prev;
          }
          return {
            ...prev,
            [targetContactId]: nextReadAt,
          };
        });
      }

      if (data.myLastReadAt) {
        myLastReadAtByContactRef.current.set(
          targetContactId,
          maxIsoTimestamp(
            myLastReadAtByContactRef.current.get(targetContactId),
            data.myLastReadAt,
          ),
        );
      }

      setHistoryErrorState((prev) => (prev?.contactId === targetContactId ? null : prev));

      if (!silent) {
        setPage(0);
        setHasNext(data.hasNext);
        setLoadedContactId(targetContactId);
      } else {
        setHasNext((prevHasNext) => prevHasNext || data.hasNext);
      }
    },
    [clearAckTimer],
  );

  const loadHistoryForContact = useCallback(
    (targetContactId: string, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      const requestSeq = ++historyRequestSeqRef.current;

      if (!silent) {
        setIsFetchingHistory(true);
        setHistoryErrorState(null);
        setPage(0);
      }

      chatService
        .getHistory(targetContactId, 0)
        .then((data) => {
          if (
            activeContactIdRef.current !== targetContactId ||
            requestSeq !== historyRequestSeqRef.current
          ) {
            return;
          }
          applyHistoryResult(targetContactId, data, silent);
        })
        .catch((err: unknown) => {
          if (
            activeContactIdRef.current !== targetContactId ||
            requestSeq !== historyRequestSeqRef.current
          ) {
            return;
          }
          if (!silent) {
            setHistoryErrorState({
              contactId: targetContactId,
              message: err instanceof Error ? err.message : "Không thể tải lịch sử tin nhắn",
            });
            setLoadedContactId(targetContactId);
          }
        })
        .finally(() => {
          if (
            !silent &&
            activeContactIdRef.current === targetContactId &&
            requestSeq === historyRequestSeqRef.current
          ) {
            setIsFetchingHistory(false);
          }
        });
    },
    [applyHistoryResult],
  );

  useEffect(() => {
    const timers = pendingTimersRef.current;
    const unsubscribe = subscribeSocketEvents({
      onMessage: (incoming) => {
        if (incoming.type && incoming.type !== "CHAT") return;

        clearAckTimer(incoming.clientMessageId);
        const confirmed: ChatUiMessage = {
          ...incoming,
          deliveryStatus: "sent",
          errorMessage: null,
        };
        setMessages((prev) => mergeMessages(prev, [confirmed]));
      },
      onReadReceipt: (receipt) => {
        const me = currentUserIdRef.current;

        if (receipt.readerId === me) {
          myLastReadAtByContactRef.current.set(
            receipt.partnerId,
            maxIsoTimestamp(
              myLastReadAtByContactRef.current.get(receipt.partnerId),
              receipt.lastReadAt,
            ),
          );
          return;
        }

        setPartnerReadAtByContact((prev) => {
          const nextReadAt = maxIsoTimestamp(prev[receipt.readerId], receipt.lastReadAt);
          if (nextReadAt === (prev[receipt.readerId] ?? null)) {
            return prev;
          }
          return {
            ...prev,
            [receipt.readerId]: nextReadAt,
          };
        });
      },
      onServerError: (errEvent) => {
        if (errEvent.clientMessageId) {
          clearAckTimer(errEvent.clientMessageId);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.clientMessageId === errEvent.clientMessageId &&
              msg.senderId === currentUserIdRef.current
                ? {
                    ...msg,
                    deliveryStatus: "failed",
                    errorMessage: errEvent.message || "Không thể gửi tin nhắn.",
                  }
                : msg,
            ),
          );
          return;
        }
        setLocalError(errEvent.message || "Không thể gửi tin nhắn.");
      },
      onConnectionChange: (connected, info) => {
        if (connected) {
          setLocalError(null);
          if (info?.isReconnect && activeContactIdRef.current) {
            loadHistoryForContact(activeContactIdRef.current, { silent: true });
          }
          return;
        }

        timers.forEach((timer) => clearTimeout(timer));
        timers.clear();

        setMessages((prev) =>
          prev.map((msg) =>
            msg.deliveryStatus === "sending"
              ? {
                  ...msg,
                  deliveryStatus: "failed",
                  errorMessage: "Mất kết nối trong lúc gửi.",
                }
              : msg,
          ),
        );
      },
    });

    return () => {
      unsubscribe();
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [clearAckTimer, loadHistoryForContact, subscribeSocketEvents]);

  useEffect(() => {
    if (!contactId) return;
    let isCancelled = false;
    const requestSeq = ++historyRequestSeqRef.current;

    chatService
      .getHistory(contactId, 0)
      .then((data) => {
        if (
          isCancelled ||
          activeContactIdRef.current !== contactId ||
          requestSeq !== historyRequestSeqRef.current
        ) {
          return;
        }
        applyHistoryResult(contactId, data, false);
      })
      .catch((err: unknown) => {
        if (
          isCancelled ||
          activeContactIdRef.current !== contactId ||
          requestSeq !== historyRequestSeqRef.current
        ) {
          return;
        }
        setHistoryErrorState({
          contactId,
          message: err instanceof Error ? err.message : "Không thể tải lịch sử tin nhắn",
        });
        setLoadedContactId(contactId);
      });

    return () => {
      isCancelled = true;
    };
  }, [applyHistoryResult, contactId]);

  const effectiveHistoryLoading =
    Boolean(contactId) && (isFetchingHistory || loadedContactId !== contactId);

  const historyError =
    contactId && historyErrorState?.contactId === contactId
      ? historyErrorState.message
      : null;

  useEffect(() => {
    if (!contactId || effectiveHistoryLoading || !isTabVisible) return;

    let latestPartnerMsg: ChatUiMessage | undefined;
    let latestConfirmedConvMsg: ChatUiMessage | undefined;

    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (
        !m ||
        m.messageId.startsWith("temp:") ||
        m.deliveryStatus === "sending" ||
        m.deliveryStatus === "failed"
      ) {
        continue;
      }
      const belongsToConv =
        (m.senderId === contactId && m.recipientId === currentUserId) ||
        (m.senderId === currentUserId && m.recipientId === contactId);
      if (!belongsToConv) continue;

      if (!latestConfirmedConvMsg) {
        latestConfirmedConvMsg = m;
      }
      if (m.senderId === contactId && m.recipientId === currentUserId) {
        latestPartnerMsg = m;
        break;
      }
    }

    const targetMsg = latestPartnerMsg ?? (hasUnread ? latestConfirmedConvMsg : undefined);
    if (!targetMsg) return;

    const targetTs = Date.parse(targetMsg.createdAt);
    if (Number.isNaN(targetTs)) return;

    const knownReadIso = myLastReadAtByContactRef.current.get(contactId);
    const knownReadTs = knownReadIso ? Date.parse(knownReadIso) : -1;
    const inFlightIso = inFlightReadAtByContactRef.current.get(contactId);
    const inFlightTs = inFlightIso ? Date.parse(inFlightIso) : -1;

    if (targetTs <= knownReadTs || targetTs <= inFlightTs) {
      return;
    }

    inFlightReadAtByContactRef.current.set(contactId, targetMsg.createdAt);

    chatService
      .markConversationRead({
        contactId,
        lastMessageId: targetMsg.messageId,
      })
      .then((res) => {
        const effectiveIso = res.lastReadAt || targetMsg.createdAt;
        myLastReadAtByContactRef.current.set(
          contactId,
          maxIsoTimestamp(myLastReadAtByContactRef.current.get(contactId), effectiveIso),
        );
        onMarkedReadRef.current?.(contactId, effectiveIso);
      })
      .catch(() => {
        const currentInFlight = inFlightReadAtByContactRef.current.get(contactId);
        if (currentInFlight === targetMsg.createdAt) {
          inFlightReadAtByContactRef.current.delete(contactId);
        }
      });
  }, [contactId, currentUserId, effectiveHistoryLoading, hasUnread, isTabVisible, messages]);

  const loadOlder = useCallback(async () => {
    if (!contactId || !hasNext || effectiveHistoryLoading) return;

    setIsFetchingHistory(true);
    try {
      const nextPage = page + 1;
      const data = await chatService.getHistory(contactId, nextPage);
      if (activeContactIdRef.current !== contactId) return;

      const formatted: ChatUiMessage[] = data.messages.map((m) => ({
        ...m,
        conversationId: m.conversationId ?? data.conversationId ?? null,
        type: "CHAT",
        deliveryStatus: "sent",
        errorMessage: null,
      }));

      setMessages((prev) => mergeMessages(prev, formatted));
      setPage(nextPage);
      setHasNext(data.hasNext);
    } catch (err) {
      if (activeContactIdRef.current === contactId) {
        setHistoryErrorState({
          contactId,
          message: err instanceof Error ? err.message : "Không thể tải thêm tin nhắn",
        });
      }
    } finally {
      if (activeContactIdRef.current === contactId) {
        setIsFetchingHistory(false);
      }
    }
  }, [contactId, effectiveHistoryLoading, hasNext, page]);

  const sendMessage = useCallback(
    (text: string, recipientId: string): boolean => {
      const trimmed = text.trim();
      const me = currentUserIdRef.current;
      if (!trimmed || !recipientId || !me) return false;

      const clientMessageId = generateClientMessageId();
      const sent = sendSocketMessage({
        recipientId,
        message: trimmed,
        clientMessageId,
      });

      const optimistic: ChatUiMessage = {
        messageId: `temp:${clientMessageId}`,
        clientMessageId,
        senderId: me,
        recipientId,
        message: trimmed,
        createdAt: new Date().toISOString(),
        type: "CHAT",
        deliveryStatus: sent ? "sending" : "failed",
        errorMessage: sent ? null : "Mất kết nối máy chủ. Nhấn Gửi lại khi kết nối phục hồi.",
      };

      setMessages((prev) => mergeMessages(prev, [optimistic]));
      if (sent) {
        scheduleAckTimeout(clientMessageId);
      }

      return true;
    },
    [scheduleAckTimeout, sendSocketMessage],
  );

  const retryMessage = useCallback(
    (clientMessageId: string) => {
      const target = messages.find(
        (m) => m.clientMessageId === clientMessageId && m.deliveryStatus === "failed",
      );
      if (!target) return;

      const sent = sendSocketMessage({
        recipientId: target.recipientId,
        message: target.message,
        clientMessageId,
      });

      if (!sent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === clientMessageId
              ? {
                  ...m,
                  deliveryStatus: "failed",
                  errorMessage: "Chưa kết nối lại được máy chủ. Vui lòng thử lại sau.",
                }
              : m,
          ),
        );
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMessageId
            ? {
                ...m,
                deliveryStatus: "sending",
                errorMessage: null,
              }
            : m,
        ),
      );
      scheduleAckTimeout(clientMessageId);
    },
    [messages, scheduleAckTimeout, sendSocketMessage],
  );

  const deleteFailedMessage = useCallback(
    (clientMessageId: string) => {
      clearAckTimer(clientMessageId);
      setMessages((prev) =>
        prev.filter(
          (m) => !(m.clientMessageId === clientMessageId && m.deliveryStatus === "failed"),
        ),
      );
    },
    [clearAckTimer],
  );

  const reconnect = useCallback(() => {
    setLocalError(null);
    reconnectSocket();
  }, [reconnectSocket]);

  const partnerLastReadAt = contactId
    ? maxIsoTimestamp(initialPartnerLastReadAt, partnerReadAtByContact[contactId] ?? null)
    : null;

  return {
    messages,
    isConnected: connectionStatus === "connected",
    connectionStatus,
    error: localError || socketError,
    partnerLastReadAt,
    sendMessage,
    retryMessage,
    deleteFailedMessage,
    reconnect,
    loadOlder,
    isHistoryLoading: effectiveHistoryLoading,
    historyError,
    hasOlder: hasNext,
    retryHistory: () => contactId && loadHistoryForContact(contactId),
  };
}
