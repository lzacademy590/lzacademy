import Head from "next/head";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

interface SEOProps {
    title: string;
    description: string;
    url?: string;
    image?: string;
}

export default function SEO({ title, description, url, image }: SEOProps) {
    return (
        <Head>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href={url || URL_DEL_SITIO} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url || URL_DEL_SITIO} />
            <meta property="og:image" content={image || "/og-default.jpg"} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image || "/og-default.jpg"} />
        </Head>
    );
}
