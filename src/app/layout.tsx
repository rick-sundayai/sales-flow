import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AuthProvider } from "@/hooks/useAuth"
import { QueryProvider } from "@/lib/providers/query-provider"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { SessionActivityTracker } from "@/components/ui/SessionActivityTracker"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SalesFlow CRM",
  description: "Modern CRM built with Next.js 15 and Supabase",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <QueryProvider>
                <SessionActivityTracker />
                {children}
              </QueryProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}