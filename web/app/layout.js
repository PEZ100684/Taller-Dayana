import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://tallerdayana.vercel.app"),
  title: "Taller Dayana | Enderezado y Pintura Automotriz en Alajuela",
  description:
    "Taller Dayana en Barrio San José de Alajuela, Costa Rica. Más de 60 años de experiencia en enderezado, pintura automotriz y reparación de carrocería. Solicite presupuesto o cita en línea.",
  keywords: [
    "Taller Dayana",
    "Taller Dayana Alajuela",
    "enderezado y pintura Alajuela",
    "taller automotriz San José de Alajuela",
    "reparación de carrocería Costa Rica",
    "Randy Barrantes",
    "Dagoberto Barrantes"
  ],
  alternates: {
    canonical: "https://tallerdayana.vercel.app"
  },
  openGraph: {
    title: "Taller Dayana | Enderezado y Pintura en Alajuela",
    description:
      "Enderezado, pintura y reparación de carrocería en Barrio San José de Alajuela. Cotice su reparación y agende su cita en línea.",
    url: "https://tallerdayana.vercel.app",
    siteName: "Taller Dayana",
    locale: "es_CR",
    type: "website"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoBodyShop",
  name: "Taller Dayana",
  url: "https://tallerdayana.vercel.app",
  telephone: ["+50670439248", "+50688698157"],
  email: "pescado100684@yahoo.es",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Barrio San José de Alajuela, Calle La Torre, Urbanización La Unión, al puro fondo",
    addressLocality: "Alajuela",
    addressRegion: "Alajuela",
    addressCountry: "CR"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 10.0188372,
    longitude: -84.2361356
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday"],
      opens: "08:00",
      closes: "13:00"
    }
  ],
  sameAs: [
    "https://www.google.com/maps/place/Taller+Dayana/@10.0189955,-84.2360667,20.5z/data=!4m11!1m4!7m3!1m1!1s116661075415157394462!2e2!3m5!1s0x8fa0f9604b8acd11:0xe3eb01ff61086c8b!8m2!3d10.0188372!4d-84.2361356!16s%2Fg%2F11hdkshc7w"
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
