import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://talemistry.com"),
  title: {
    default: "Talemistry | AI Recruitment Platform for Human-Supervised Hiring",
    template: "%s · Talemistry",
  },
  description:
    "Talemistry is an AI recruitment platform that connects candidate discovery, assessment, interviews, decisions and offers in one human-supervised hiring workspace.",
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
  alternates: { canonical: "/" },
  category: "Recruitment software",
  applicationName: "Talemistry",
  openGraph: {
    type: "website",
    siteName: "Talemistry",
    title: "Talemistry | AI Recruitment Platform for Human-Supervised Hiring",
    description:
      "AI recruitment software for connected, explainable hiring from candidate discovery through signed offer.",
    url: "https://talemistry.com",
    images: [
      {
        url: "/hero-collaboration.png",
        width: 720,
        height: 560,
        alt: "Talemistry recruitment team collaboration",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Talemistry | AI Recruitment Platform",
    description:
      "Connected, explainable recruitment with human-supervised AI.",
    images: ["/hero-collaboration.png"],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1b2a" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
