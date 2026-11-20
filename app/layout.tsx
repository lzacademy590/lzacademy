import "./globals.css";
import type { Metadata } from "next";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { SiteWrapper } from "./components/SiteWrapper";
import { Playfair_Display, Barlow_Condensed, Outfit, Hanken_Grotesk } from "next/font/google";
import { URL_DEL_SITIO, CORREO_DE_CONTACTO } from "@/app/lib/sitio";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-barlow",
  display: "swap",
});

// Marca 2026. Outfit (titulares) y Hanken Grotesk (texto) sustituyen a Broxa y
// Neue Montreal, las del manual de marca, hasta tener sus archivos de fuente.
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const BASE_URL = URL_DEL_SITIO;

// ─── Metadata base ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Lainz 590 | Aprende inglés en 90 días",
    template: "%s | Lainz 590",
  },
  description:
    "Aprende inglés en 90 días con el Método 590. Rutina de 5 sesiones diarias diseñada para construir fluidez real.",
  // El favicon y el icono de Apple los ponen app/icon.png y app/apple-icon.png
  // (logo Lainz 590), por convención de archivos de Next: no hace falta `icons`.
  openGraph: {
    siteName: "Lainz 590",
    type: "website",
    locale: "es_ES",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lz_academym590",
  },
  robots: {
    index: true,
    follow: true,
  },
  // Search Console del Gmail del negocio (lzacademy590@gmail.com). El DNS de
  // lz-englishacademy.com está en una cuenta de Vercel ajena, así que se
  // verifica con la meta. Hace falta para el cambio de dirección a lainz590.com.
  verification: {
    google: "c8llODH7S1J4FwWM_ocx37AfHvTuOHdWut4V5-xAUlE",
  },
};

// ─── Schema Organization ──────────────────────────────────────────────────────
function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "LZ English Academy",
    alternateName: "Método 590",
    url: BASE_URL,
    logo: `${BASE_URL}/lzacademy_logo1.png`,
    description:
      "Academia de inglés online. El Método 590 convierte el inglés en una rutina diaria estructurada para construir fluidez real en 90 días.",
    foundingDate: "2021",
    founder: {
      "@type": "Person",
      name: "Loren Laínez",
      jobTitle: "Fundadora",
      sameAs: [
        "https://instagram.com/lz_academym590",
        "https://tiktok.com/@lore_lainez21",
      ],
    },
    sameAs: [
      "https://instagram.com/lz_academym590",
      "https://tiktok.com/@lore_lainez21",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: CORREO_DE_CONTACTO,
      contactType: "customer support",
      availableLanguage: "Spanish",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Planes LZ English Academy",
      itemListElement: [
        {
          "@type": "Offer",
          name: "Plan Essential",
          price: "10",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: `${BASE_URL}/essential`,
        },
        {
          "@type": "Offer",
          name: "Plan Premium",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: `${BASE_URL}/premium`,
        },
        {
          "@type": "Offer",
          name: "Plan Personalizado",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: `${BASE_URL}/personalizado`,
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${barlow.variable} ${outfit.variable} ${hanken.variable}`}>
      <head>
        <OrganizationSchema />
      </head>
      <body className="min-h-screen bg-white text-lz-ink font-sans flex flex-col">
        <SiteWrapper>{children}</SiteWrapper>

        <GoogleAnalytics />
      </body>
    </html>
  );
}