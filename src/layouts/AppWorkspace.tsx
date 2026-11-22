import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { useChatbot } from "@/contexts/ChatbotContext";
import { useAuth } from "@/contexts/AuthContext";
import { ConsultationProvider, useConsultation } from "@/contexts/ConsultationContext";
import { ChatbotConversationList } from "@/components/chatbot/ChatbotConversationList";
import { AdvisorConversationList } from "@/components/chat/AdvisorConversationList";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { AdvisorContactDialog } from "@/components/chat/AdvisorContactDialog";
import { ROUTES } from "@/routes";
import { AppLayout, useAppLayout } from "./AppLayout";

export function AppWorkspace({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  return (
    <ConsultationProvider
      key={isAuthenticated ? user?.id || "authenticated" : "guest"}
      enabled={isAuthenticated && !isLoading && router.pathname === ROUTES.PORTAL.CHAT && (user?.role === "STUDENT" || user?.role === "ADVISOR")}
    >
      <AppWorkspaceContent>{children}</AppWorkspaceContent>
    </ConsultationProvider>
  );
}

function AppWorkspaceContent({ children }: { children: ReactNode }) {
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
    <AppLayout
      sidebar={({ isCollapsed, closeMobileSidebar, toggleSidebar }) => (
        <AppSidebar
          currentUser={user}
          onLogout={handleLogout}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleSidebar}
          onNavigate={closeMobileSidebar}
        >
          {router.pathname === ROUTES.PUBLIC.CHATBOT && (!user || user.role === "STUDENT") && (
            <ChatbotConversationList isCollapsed={isCollapsed} onSelect={closeMobileSidebar} />
          )}
          {router.pathname === ROUTES.PORTAL.CHAT && (
            <AdvisorConversationList
              role={user?.role === "ADVISOR" ? "ADVISOR" : "STUDENT"}
              conversations={conversations}
              selectedPartnerId={selectedContact?.accountId ?? null}
              onSelectConversation={(item) => {
                handleSelectConversation(item);
                closeMobileSidebar();
              }}
              onOpenAdvisorDialog={() => setIsAdvisorDialogOpen(true)}
              isLoading={isConversationsLoading}
              error={conversationsError}
              onRetry={refreshConversations}
              isCollapsed={isCollapsed}
            />
          )}
        </AppSidebar>
      )}
    >
      {children}
      {router.pathname === ROUTES.PORTAL.CHAT && user?.role === "STUDENT" && <ConsultationDialog />}
    </AppLayout>
  );
}

function ConsultationDialog() {
  const { closeMobileSidebar } = useAppLayout();
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
        closeMobileSidebar();
      }}
      existingAdvisorIds={conversations.map((conversation) => conversation.partnerId)}
    />
  );
}
