import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { academy } from "@/lib/academy";
import { MotionProvider } from "@/components/motion-provider";
<<<<<<< HEAD
import Script from "next/script";
=======
>>>>>>> 2e5bb2da01c56114268408d36b054c99a181f9d0

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://celestialbadmintonacademy.com/");

<<<<<<< HEAD

      //meta data for the site, including title, description, keywords, open graph, twitter card, and robots meta tags
=======
>>>>>>> 2e5bb2da01c56114268408d36b054c99a181f9d0
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Badminton Academy in Noida | Celestial's, Sector 104",
    template: "%s · Celestial's Badminton Academy",
  },
  description:
    "Badminton coaching for kids, teens and adults in Sector 104, Noida. 7 AC indoor courts, NIS-certified coaches, gym and physio. First session free.",
  keywords: [
    "badminton academy in noida",
    "badminton coaching sector 104 noida",
    "indoor badminton courts noida",
    "badminton training for kids noida",
    "pay and play badminton courts noida",
    "celestial's badminton academy",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: academy.name,
    title: "Celestial's Badminton Academy — Noida Sector 104",
    description: "7 indoor AC courts, BWF certified coaches, batches for kids and adults. Book your free trial.",
    images: [{ url: "/images/play-rally-1600.webp", width: 1440, height: 1080, alt: "Badminton coaching at Celestial's" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Badminton Academy in Noida | Celestial's, Sector 104",
    description: "7 indoor AC courts, professional coaching & free trial.",
    images: ["/images/play-rally-1600.webp"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#041a1b",
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom is deliberately NOT disabled (4 of 5 racket-sport sites researched lock it).
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: academy.name,
  sport: "Badminton",
  image: `${siteUrl}/images/courts-panorama-1600.webp`,
  telephone: "+918826268236",
  priceRange: "₹450 - ₹1500",
  currenciesAccepted: "INR",
  paymentAccepted: "Cash, UPI, Credit Card",
  address: {
    "@type": "PostalAddress",
    streetAddress: `${academy.address.line1}, ${academy.address.line2}`,
    addressLocality: "Sector 104, Noida",
    addressRegion: "Uttar Pradesh",
    postalCode: "201304",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: academy.address.lat,
    longitude: academy.address.lng,
  },
<<<<<<< HEAD
=======
  // ⭐ This enables the 4.4 Gold Star Rating in Google search results:
>>>>>>> 2e5bb2da01c56114268408d36b054c99a181f9d0
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.4",
    reviewCount: "326",
    bestRating: "5",
    worstRating: "1",
  },
  openingHoursSpecification: academy.hours.flatMap(
    (h): { "@type": string; dayOfWeek: string; opens: string; closes: string }[] => {
      if ("slots" in h && h.slots) {
        return h.slots.map((slot) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: h.day,
          opens: slot.open,
          closes: slot.close,
        }));
      }
      if ("open" in h && "close" in h) {
        return [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.day,
            opens: h.open,
            closes: h.close,
          },
        ];
      }
      return [];
    }),
  logo: `${siteUrl}/images/LOGO.png`,
  sameAs: [
    academy.contact.instagram.url,
    academy.contact.facebook,
    academy.address.mapsUrl,
    academy.booking.primary.url,
    academy.booking.secondary.url,
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth" className={`${archivo.variable} ${mono.variable} antialiased`}>
<<<<<<< HEAD
     
      <head>
        <meta name="google-site-verification" content="fGXRTk2GKDOIJ92z1HU-D2wJiTgipTduGqC1Md1roJ4" />
  <noscript>
    <iframe
      src="https://www.googletagmanager.com/ns.html?id=GTM-T5W8H6KH"
      height="0"
      width="0"
      style={{ display: "none", visibility: "hidden" }}
      title="Google Tag Manager"
    />
  </noscript>
</head>
      <body className="min-h-dvh flex flex-col">
      
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            (function (w, d, s, l, i) {
              w[l] = w[l] || [];
              w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' }); var f = d.getElementsByTagName(s)[0],
              j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
              'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
            })(window, document, 'script', 'dataLayer', 'GTM-T5W8H6KH');
    `,
          }}
        />

=======
      <body className="min-h-dvh flex flex-col">
>>>>>>> 2e5bb2da01c56114268408d36b054c99a181f9d0
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <MotionProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </MotionProvider>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
