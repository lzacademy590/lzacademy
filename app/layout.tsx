import "./globals.css";
import type { Metadata } from "next";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { SiteWrapper } from "./components/SiteWrapper";
import { Playfair_Display, Barlow_Condensed , Charmonman} from "next/font/google";

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

const BASE_URL = "https://lz-englishacademy.com";

// ─── Metadata base ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "LZ English Academy | Aprende inglés en 90 días",
    template: "%s | LZ English Academy",
  },
  description:
    "Aprende inglés en 90 días con el Método 590. Rutina de 5 sesiones diarias diseñada para construir fluidez real. Desde $10/mes.",
  icons: {
    icon: "/lzacademy_logo2.png",
    apple: "/lzacademy_logo2.png",
  },
  openGraph: {
    siteName: "LZ English Academy",
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
      email: "info@lz-englishacademy.com",
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
    <html lang="es" className={`${playfair.variable} ${barlow.variable}`}>
      <head>
        <OrganizationSchema />
      </head>
      <body className="min-h-screen bg-white text-zinc-900 flex flex-col">
        <SiteWrapper>{children}</SiteWrapper>

        <GoogleAnalytics />
      </body>
    </html>
  );
}