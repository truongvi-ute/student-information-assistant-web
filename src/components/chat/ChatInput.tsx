"use client";
import React from "react";

interface ChatInputProps {
    username: string;
}

export function ChatInput({ username }: ChatInputProps) {
    return (
        <div className="flex-1 flex flex-col">
            <input type="text" placeholder="Nhập tin nhắn" />
            <button>Gửi</button>
        </div>
    );
} 