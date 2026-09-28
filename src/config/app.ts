import {env} from "@/config/env"

export const APP_CONFIG = {
  name: env.appName,
  description: "Trợ lý thông tin sinh viên",
} as const;