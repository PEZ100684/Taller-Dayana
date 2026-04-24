export default ({ config }) => ({
  ...config,
  name: "Taller Dayana",
  slug: "taller-dayana",
  version: "1.0.0",
  orientation: "portrait",
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000"
  }
});
