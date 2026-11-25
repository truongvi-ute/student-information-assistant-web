import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/router";
import { useChatbot } from "@/contexts/ChatbotContext";
import { useAuth } from "@/contexts/AuthContext";
import { ConsultationProvider, useConsultation } from "@/contexts/ConsultationContext";
import { ChatbotConversationList } from "@/components/chatbot/ChatbotConversationList";
import { AdvisorConversationList } from "@/components/chat/AdvisorConversationList";
import { ChatIncomingToast } from "@/components/chat/ChatIncomingToast";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { AdvisorContactDialog } from "@/components/chat/AdvisorContactDialog";
import { ROUTES } from "@/routes";
import { authStorage } from "@/utils/auth-storage";
import { AppLayout, useAppLayout } from "./AppLayout";

export function AppWorkspace({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const isDirectChatRole =
    user?.role === "STUDENT" || user?.role === "ADVISOR";
  const resolvedUserId =
    isAuthenticated && !isLoading
      ? String(user?.id || authStorage.getAccountId() || "")
      : "";

  return (
    <ConsultationProvider
      key={isAuthenticated ? user?.id || "authenticated" : "guest"}
      enabled={isAuthenticated && !isLoading && isDirectChatRole}
      currentUserId={resolvedUserId}
      currentUserRole={user?.role}
      isChatPageActive={router.pathname === ROUTES.PORTAL.CHAT}
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
    totalUnreadCount,
    selectedContact,
    isConversationsLoading,
    conversationsError,
    incomingToast,
    dismissIncomingToast,
    refreshConversations,
    handleSelectConversation,
    openConversationByPartner,
    setIsAdvisorDialogOpen,
  } = useConsultation();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const pathOnly = url.split("?")[0];
      if (pathOnly === ROUTES.PORTAL.CHAT || pathOnly.startsWith(`${ROUTES.PORTAL.CHAT}/`)) {
        dismissIncomingToast();
      }
    };
    router.events.on("routeChangeStart", handleRouteChange);
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [dismissIncomingToast, router.events]);

  const handleLogout = () => {
    dismissIncomingToast();
    clearConversations();
    logout();
    void router.push(ROUTES.PUBLIC.CHATBOT);
  };

  const toastSenderName = incomingToast
    ? conversations.find((c) => c.partnerId === incomingToast.partnerId)?.partnerName ||
      incomingToast.senderName
    : "";

  return (
    <AppLayout
      sidebar={({ isCollapsed, closeMobileSidebar, toggleSidebar }) => (
        <AppSidebar
          currentUser={user}
          chatUnreadCount={totalUnreadCount}
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
      {router.pathname !== ROUTES.PORTAL.CHAT && incomingToast && (
        <ChatIncomingToast
          toast={{ ...incomingToast, senderName: toastSenderName }}
          onDismiss={dismissIncomingToast}
          onOpen={(toast) => {
            openConversationByPartner(toast.partnerId, toastSenderName, toast.senderRole);
            dismissIncomingToast();
            void router.push(ROUTES.PORTAL.CHAT);
          }}
        />
      )}
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
