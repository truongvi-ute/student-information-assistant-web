import type { AppProps } from "next/app";
import Head from "next/head";
import { sourceSans3 } from "@/styles/fonts";
import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { RouteGuard } from "@/routes/RouteGuard";

export default function NextApp({ Component, pageProps }: AppProps) {
  return (
    <div className={`${sourceSans3.variable} font-sans min-h-screen`}>
      <Head>
        <title>Student Assistant</title>
        <meta name="description" content="Trợ lý thông tin dành cho sinh viên" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthProvider>
        <RouteGuard>
          <Component {...pageProps} />
        </RouteGuard>
      </AuthProvider>
    </div>
  );
}