export default function sitemap() {
  return [
    {
      url: "https://tallerdayana.vercel.app",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: "https://tallerdayana.vercel.app/seguimiento",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    }
  ];
}
