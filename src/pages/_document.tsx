import { Html, Head, Main, NextScript } from "next/document";
import { sourceSans3 } from "@/styles/fonts";

export default function Document() {
  return (
    <Html lang="vi" className={sourceSans3.variable}>
      <Head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Dancing+Script:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="font-sans antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
