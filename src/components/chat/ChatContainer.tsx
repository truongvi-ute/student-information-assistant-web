"use client";
import React, { useRef } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface ChatProps {
  username: string;
}

export function ChatContainer({ username }: ChatProps) {
  return (
    <div className="h-screen w-full flex flex-col bg-[#071a3d]">
      {/* Side bar */}
      <ChatSidebar />
      {/* Main content - MessageList and ChatInput */}
      <div className="flex-1 flex flex-col">
        <MessageList username={username} />
        <ChatInput username={username} />
      </div>
    </div>
  );
}