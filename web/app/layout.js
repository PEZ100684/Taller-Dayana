import Script from "next/script";
import "./globals.css";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "123456789012345";
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "";

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
    images: [
      {
        url: "/cases/case-6.jpg",
        width: 1200,
        height: 630,
        alt: "Taller Dayana - Enderezado y Pintura Automotriz"
      }
    ],
    locale: "es_CR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Taller Dayana | Enderezado y Pintura en Alajuela",
    description: "Enderezado, pintura y reparación de carrocería con seguimiento 24/7 en Alajuela, Costa Rica.",
    images: ["/cases/case-6.jpg"]
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
    "https://facebook.com/tallerdayana",
    "https://instagram.com/tallerdayana",
    "https://tiktok.com/@tallerdayana",
    "https://www.google.com/maps/place/Taller+Dayana/@10.0189955,-84.2360667,20.5z/data=!4m11!1m4!7m3!1m1!1s116661075415157394462!2e2!3m5!1s0x8fa0f9604b8acd11:0xe3eb01ff61086c8b!8m2!3d10.0188372!4d-84.2361356!16s%2Fg%2F11hdkshc7w"
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Meta Pixel (Facebook & Instagram) */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>

        {/* TikTok Pixel (Configurable) */}
        {TIKTOK_PIXEL_ID ? (
          <Script id="tiktok-pixel" strategy="afterInteractive">
            {`
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('${TIKTOK_PIXEL_ID}');
                ttq.page();
              }(window, document, 'ttq');
            `}
          </Script>
        ) : null}
      </head>
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
