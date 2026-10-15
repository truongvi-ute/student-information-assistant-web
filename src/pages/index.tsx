import React from "react";
import Head from "next/head";
import { HomeView } from "@/components/home/HomeView";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>HCMUTE Student Assistant — Trợ lý thông tin sinh viên</title>
        <meta
          name="description"
          content="Chào mừng bạn đến với trợ lý thông tin sinh viên HCMUTE. Mọi điều cần biết cho hành trình học tập của bạn, bắt đầu từ đây."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <HomeView />
    </>
  );
}