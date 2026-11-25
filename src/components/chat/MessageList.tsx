import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { ChatContact, ChatUiMessage } from "@/types/chat";
import { MessageItem, type MessageDisplayStatus } from "./MessageItem";
import { ChatEmptyState } from "./ChatEmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface MessageListProps {
  messages: ChatUiMessage[];
  currentUserId: string;
  selectedContact: ChatContact | null;
  partnerLastReadAt?: string | null;
  hasOlder?: boolean;
  isHistoryLoading?: boolean;
  historyError?: string | null;
  onRetryHistory?: () => void;
  onLoadOlder?: () => void;
  onRetryMessage?: (clientMessageId: string) => void;
  onDeleteFailedMessage?: (clientMessageId: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  selectedContact,
  partnerLastReadAt = null,
  hasOlder = false,
  isHistoryLoading = false,
  historyError = null,
  onRetryHistory,
  onLoadOlder,
  onRetryMessage,
  onDeleteFailedMessage,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const prevContactIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef(0);
  const prevLastKeyRef = useRef<string | undefined>(undefined);
  const prependAnchorRef = useRef<{ height: number; top: number; count: number } | null>(null);

  const selectedPartnerId = selectedContact?.accountId ?? null;

  const conversationMessages = useMemo(
    () =>
      selectedPartnerId
        ? messages.filter(
            (m) =>
              (m.senderId === currentUserId && m.recipientId === selectedPartnerId) ||
              (m.senderId === selectedPartnerId && m.recipientId === currentUserId),
          )
        : [],
    [currentUserId, messages, selectedPartnerId],
  );

  const lastMessage = conversationMessages.at(-1);
  const lastMessageKey = lastMessage
    ? lastMessage.clientMessageId || lastMessage.messageId
    : undefined;

  let lastConfirmedOwnMsgId: string | undefined;
  for (let i = conversationMessages.length - 1; i >= 0; i--) {
    const m = conversationMessages[i];
    if (
      m.senderId === currentUserId &&
      !m.messageId.startsWith("temp:") &&
      m.deliveryStatus !== "sending" &&
      m.deliveryStatus !== "failed"
    ) {
      lastConfirmedOwnMsgId = m.messageId;
      break;
    }
  }

  const partnerReadTs = partnerLastReadAt ? Date.parse(partnerLastReadAt) : Number.NaN;

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const contactChanged = prevContactIdRef.current !== selectedPartnerId;
    const prevCount = prevMessageCountRef.current;
    const prevLastKey = prevLastKeyRef.current;

    if (contactChanged) {
      prevContactIdRef.current = selectedPartnerId;
      prependAnchorRef.current = null;
      if (container && conversationMessages.length > 0) {
        container.scrollTop = container.scrollHeight;
      }
      prevMessageCountRef.current = conversationMessages.length;
      prevLastKeyRef.current = lastMessageKey;
      return;
    }

    const snap = prependAnchorRef.current;
    if (snap) {
      if (conversationMessages.length > snap.count) {
        prependAnchorRef.current = null;
        if (container) {
          container.scrollTop = snap.top + (container.scrollHeight - snap.height);
        }
        prevMessageCountRef.current = conversationMessages.length;
        prevLastKeyRef.current = lastMessageKey;
        return;
      }
      if (!isHistoryLoading) {
        prependAnchorRef.current = null;
      }
    }

    if (prevCount === 0 && conversationMessages.length > 0) {
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } else if (lastMessageKey && lastMessageKey !== prevLastKey) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevMessageCountRef.current = conversationMessages.length;
    prevLastKeyRef.current = lastMessageKey;
  }, [conversationMessages.length, isHistoryLoading, lastMessageKey, selectedPartnerId]);

  const handleLoadOlderClick = () => {
    const container = containerRef.current;
    if (container) {
      prependAnchorRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
        count: conversationMessages.length,
      };
    }
    onLoadOlder?.();
  };

  if (!selectedContact) {
    return <ChatEmptyState hasSelectedContact={false} />;
  }

  if (conversationMessages.length === 0) {
    if (isHistoryLoading) {
      return (
        <div
          aria-label="Đang tải lịch sử tin nhắn"
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 bg-[#F8FAFC]"
        >
          <div className="max-w-4xl mx-auto w-full space-y-4">
            <div className="flex flex-col items-start gap-1.5">
              <Skeleton className="h-3 w-20 bg-[#E2E8F0]" />
              <Skeleton className="h-11 w-56 rounded-2xl rounded-tl-xs bg-[#E2E8F0]" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Skeleton className="h-3 w-16 bg-[#E2E8F0]" />
              <Skeleton className="h-14 w-64 rounded-2xl rounded-tr-xs bg-[#DBEAFE]" />
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <Skeleton className="h-3 w-24 bg-[#E2E8F0]" />
              <Skeleton className="h-10 w-44 rounded-2xl rounded-tl-xs bg-[#E2E8F0]" />
            </div>
          </div>
        </div>
      );
    }

    if (historyError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center bg-[#F8FAFC] gap-3">
          <p className="text-sm text-[#B91C1C]">{historyError}</p>
          {onRetryHistory && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetryHistory}
              className="border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              Thử lại
            </Button>
          )}
        </div>
      );
    }

    return (
      <ChatEmptyState
        hasSelectedContact={true}
        contactName={selectedContact.fullName}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1 bg-[#F8FAFC]"
    >
      <div className="max-w-4xl mx-auto w-full">
        {hasOlder && (
          <div className="flex justify-center my-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadOlderClick}
              disabled={isHistoryLoading}
              className="text-xs h-7 border-[#CBD5E1] bg-white text-[#1D4ED8] hover:bg-[#F1F5F9]"
            >
              {isHistoryLoading ? "Đang tải tin nhắn cũ..." : "Tải thêm tin nhắn cũ"}
            </Button>
          </div>
        )}

        {conversationMessages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          let deliveryState: MessageDisplayStatus = null;

          if (isMe) {
            if (msg.deliveryStatus === "sending" || msg.deliveryStatus === "failed") {
              deliveryState = msg.deliveryStatus;
            } else if (msg.messageId === lastConfirmedOwnMsgId) {
              const msgTs = Date.parse(msg.createdAt);
              const isRead =
                !Number.isNaN(partnerReadTs) &&
                !Number.isNaN(msgTs) &&
                msgTs <= partnerReadTs;
              deliveryState = isRead ? "read" : "sent";
            }
          }

          return (
            <MessageItem
              key={msg.clientMessageId || msg.messageId}
              message={msg}
              isMe={isMe}
              partnerName={selectedContact.fullName}
              deliveryState={deliveryState}
              onRetry={onRetryMessage}
              onDelete={onDeleteFailedMessage}
            />
          );
        })}

        <div ref={endRef} />
      </div>
    </div>
  );
}
