import type { AppProps } from "next/app";
import Head from "next/head";
import "@/src/assets/globals.css";

export default function NextApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Student Assistant</title>
        <meta name="description" content="Trợ lý thông tin dành cho sinh viên" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}