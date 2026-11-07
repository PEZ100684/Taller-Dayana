export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin"
    },
    sitemap: "https://tallerdayana.vercel.app/sitemap.xml"
  };
}
