import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { TRPCProvider } from "@/lib/trpc"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SocialMonster",
  description: "AI-powered platform for social media content creation, scheduling, and professional brand design assets. Create compelling posts, schedule across multiple platforms, and generate cohesive brand assets through guided workflows.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  )
}