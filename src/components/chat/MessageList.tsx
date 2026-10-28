import { useEffect, useRef } from "react";
import type { ChatContact, ChatMessageEvent } from "@/types/chat";
import { MessageItem } from "./MessageItem";
import { ChatEmptyState } from "./ChatEmptyState";
import { Button } from "@/components/ui/button";

interface MessageListProps {
  messages: ChatMessageEvent[];
  currentUserId: string;
  selectedContact: ChatContact | null;
  hasOlder?: boolean;
  isHistoryLoading?: boolean;
  onLoadOlder?: () => void;
}

export function MessageList({
  messages,
  currentUserId,
  selectedContact,
  hasOlder = false,
  isHistoryLoading = false,
  onLoadOlder,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const conversationMessages = selectedContact
    ? messages.filter(
      (m) =>
        (m.senderId === currentUserId && m.recipientId === selectedContact.accountId) ||
        (m.senderId === selectedContact.accountId && m.recipientId === currentUserId)
    )
    : [];

  const lastMessageId = conversationMessages.at(-1)?.messageId;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId, selectedContact?.accountId]);

  if (!selectedContact) {
    return <ChatEmptyState hasSelectedContact={false} />;
  }

  if (conversationMessages.length === 0) {
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
              onClick={onLoadOlder}
              disabled={isHistoryLoading}
              className="text-xs h-7 border-[#CBD5E1] bg-white text-[#1D4ED8] hover:bg-[#F1F5F9]"
            >
              {isHistoryLoading ? "Đang tải tin nhắn cũ..." : "Tải thêm tin nhắn cũ"}
            </Button>
          </div>
        )}

        {conversationMessages.map((msg) => (
          <MessageItem
            key={msg.messageId}
            message={msg}
            isMe={msg.senderId === currentUserId}
            partnerName={selectedContact.fullName}
          />
        ))}

        <div ref={endRef} />
      </div>
    </div>
  );
}
