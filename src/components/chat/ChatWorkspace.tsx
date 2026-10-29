import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { useChatbot } from "@/contexts/ChatbotContext";
import { useAuth } from "@/contexts/AuthContext";
import { ConsultationProvider, useConsultation } from "@/contexts/ConsultationContext";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { AdvisorContactDialog } from "@/components/chat/AdvisorContactDialog";
import { ROUTES } from "@/routes";
import { ChatLayout, useChatLayout } from "../../layouts/ChatLayout";

export function ChatWorkspace({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <ConsultationProvider
      key={isAuthenticated ? user?.id || "authenticated" : "guest"}
      enabled={isAuthenticated && !isLoading}
    >
      <ChatWorkspaceContent>{children}</ChatWorkspaceContent>
    </ConsultationProvider>
  );
}

function ChatWorkspaceContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { clearConversations } = useChatbot();
  const {
    conversations,
    selectedContact,
    isConversationsLoading,
    conversationsError,
    refreshConversations,
    handleSelectConversation,
    setIsAdvisorDialogOpen,
  } = useConsultation();

  const handleLogout = () => {
    clearConversations();
    logout();
    void router.push(ROUTES.PUBLIC.CHATBOT);
  };

  return (
    <ChatLayout
      sidebar={({ isSidebarOpen, closeSidebar, toggleSidebar }) => (
        <AppSidebar
          role={user?.role === "ADVISOR" ? "ADVISOR" : "STUDENT"}
          isChatbot={router.pathname === ROUTES.PUBLIC.CHATBOT}
          conversations={conversations}
          selectedPartnerId={selectedContact?.accountId ?? null}
          onSelectConversation={(item) => {
            handleSelectConversation(item);
            if (window.innerWidth < 768) closeSidebar();
          }}
          onOpenAdvisorDialog={() => setIsAdvisorDialogOpen(true)}
          isLoading={isConversationsLoading}
          error={conversationsError}
          onRetry={refreshConversations}
          currentUser={user}
          onLogout={handleLogout}
          isCollapsed={!isSidebarOpen}
          onToggleCollapse={toggleSidebar}
          onCollapse={closeSidebar}
        />
      )}
    >
      {children}
      {router.pathname === ROUTES.PORTAL.CHAT && <ConsultationDialog />}
    </ChatLayout>
  );
}

function ConsultationDialog() {
  const { closeSidebar } = useChatLayout();
  const {
    conversations,
    isAdvisorDialogOpen,
    setIsAdvisorDialogOpen,
    handleSelectAdvisorFromDialog,
  } = useConsultation();

  return (
    <AdvisorContactDialog
      open={isAdvisorDialogOpen}
      onClose={() => setIsAdvisorDialogOpen(false)}
      onSelectAdvisor={(advisor) => {
        handleSelectAdvisorFromDialog(advisor);
        if (window.innerWidth < 768) closeSidebar();
      }}
      existingAdvisorIds={conversations.map((conversation) => conversation.partnerId)}
    />
  );
}
