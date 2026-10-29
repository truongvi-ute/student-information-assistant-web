import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useChatConversations } from "@/hooks/useChatConversations";
import type { ChatContact, ChatConversationItem } from "@/types/chat";

interface ConsultationContextType {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedContact: ChatContact | null;
  setSelectedContact: Dispatch<SetStateAction<ChatContact | null>>;
  isAdvisorDialogOpen: boolean;
  setIsAdvisorDialogOpen: Dispatch<SetStateAction<boolean>>;
  conversations: ReturnType<typeof useChatConversations>["conversations"];
  isConversationsLoading: boolean;
  conversationsError: string | null;
  refreshConversations: ReturnType<typeof useChatConversations>["refreshConversations"];
  updateOnNewMessage: ReturnType<typeof useChatConversations>["updateOnNewMessage"];
  handleSelectConversation: (item: ChatConversationItem) => void;
  handleSelectAdvisorFromDialog: (advisor: ChatContact) => void;
}

const ConsultationContext = createContext<ConsultationContextType | undefined>(undefined);

export function ConsultationProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [isAdvisorDialogOpen, setIsAdvisorDialogOpen] = useState(false);

  const {
    conversations,
    isLoading: isConversationsLoading,
    error: conversationsError,
    refreshConversations,
    updateOnNewMessage,
  } = useChatConversations(enabled);

  const handleSelectConversation = (item: ChatConversationItem) => {
    const contact: ChatContact = {
      accountId: item.partnerId,
      fullName: item.partnerName,
      role: item.partnerRole,
      departmentName: item.partnerDepartment,
    };
    setSelectedContact(contact);
  };

  const handleSelectAdvisorFromDialog = (advisor: ChatContact) => {
    const existing = conversations.find((c) => c.partnerId === advisor.accountId);
    if (existing) {
      handleSelectConversation(existing);
    } else {
      setSelectedContact(advisor);
    }
  };

  return (
    <ConsultationContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        selectedContact,
        setSelectedContact,
        isAdvisorDialogOpen,
        setIsAdvisorDialogOpen,
        conversations,
        isConversationsLoading,
        conversationsError,
        refreshConversations,
        updateOnNewMessage,
        handleSelectConversation,
        handleSelectAdvisorFromDialog,
      }}
    >
      {children}
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  const context = useContext(ConsultationContext);

  if (!context) {
    throw new Error("useConsultation phải được sử dụng bên trong ConsultationProvider");
  }

  return context;
}
