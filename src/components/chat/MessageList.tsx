"use client";
import React from "react";

interface MessageListProps {
    username: string;
}

export function MessageList({ username }: MessageListProps) {
    return (
        <div className="flex-1 flex flex-col">
            <div>{username}</div>
            <div>hello</div>
            <div>hello</div>
        </div>
    );
}   