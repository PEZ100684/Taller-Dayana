/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_API_BASE_URL ||
      "https://taller-dayana-api.onrender.com",
    NEXT_API_BASE_URL:
      process.env.NEXT_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://taller-dayana-api.onrender.com"
  }
};

module.exports = nextConfig;
