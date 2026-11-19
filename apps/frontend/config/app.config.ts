export const appConfig = {
  app: {
    name:
      process.env.NEXT_PUBLIC_APP_NAME ??
      "Care Compliance Management System",

    environment:
      process.env.NEXT_PUBLIC_APP_ENV ??
      "development",
  },

  api: {
    baseUrl:
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      "http://localhost:3000/api/v1",
  },
} as const;