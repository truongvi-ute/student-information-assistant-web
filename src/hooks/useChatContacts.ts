import { useEffect, useState } from "react";
import { chatService } from "@/services/chat.service";
import type { ChatContact } from "@/types/chat";

export function useChatContacts() {
    const [contacts, setContacts] = useState<ChatContact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        chatService.getContacts()
            .then((result) => {
                if (!cancelled) setContacts(result);
            })
            .catch((reason: unknown) => {
                if (!cancelled) {
                    setError(
                        reason instanceof Error
                            ? reason.message
                            : "Không tải được danh sách liên hệ"
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { contacts, isLoading, error };
}