import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://talemistry.com"),
  title: {
    default: "Talemistry — Reveal the chemistry of human potential",
    template: "%s · Talemistry",
  },
  description:
    "Talemistry is a full-cycle AI recruitment ecosystem by Nomado Innovations that connects job publication, candidate discovery, assessment, interviews, decisions and offers in one human-supervised platform.",
  keywords: [
    "AI recruitment",
    "talent acquisition",
    "applicant tracking system",
    "candidate intelligence",
    "recruitment ecosystem",
    "hiring platform",
    "interview scorecards",
    "talent matching",
  ],
  authors: [{ name: "Nomado Innovations" }],
  creator: "Nomado Innovations",
  openGraph: {
    type: "website",
    siteName: "Talemistry",
    title: "Talemistry — Reveal the chemistry of human potential",
    description:
      "A full-cycle AI recruitment ecosystem that unifies the journey from job publication to signed offer, with candidate intelligence and human evaluation.",
    url: "https://talemistry.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Talemistry — Reveal the chemistry of human potential",
    description:
      "Full-cycle AI recruitment ecosystem. Deeper human understanding.",
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: "#0b1b2a",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
