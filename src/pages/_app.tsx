import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { sourceSans3 } from "@/styles/fonts";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { ROUTES } from "@/routes";
import { RouteGuard, getRouteConfig } from "@/routes";
import "@/styles/globals.css";

export default function NextApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // Lấy thông tin cấu hình của trang hiện tại.
  const routeConfig = getRouteConfig(router.pathname);
  const isChatPage = router.pathname === ROUTES.PORTAL.CHAT
    || router.pathname === ROUTES.PUBLIC.CHATBOT;

  const title = routeConfig?.title ?? "Student Assistant";
  const description =
    routeConfig?.description ??
    "Trợ lý thông tin dành cho sinh viên";

  return (
    <div className={`${sourceSans3.variable} font-sans min-h-screen`}>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={description}
          key="description"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </Head>

      <AuthProvider>
        <ChatbotProvider>
        <RouteGuard>
          {isChatPage ? (
            <ChatWorkspace>
              <Component {...pageProps} />
            </ChatWorkspace>
          ) : (
            <Component {...pageProps} />
          )}
        </RouteGuard>
        </ChatbotProvider>
      </AuthProvider>
    </div>
  );
}
