import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from '@clerk/nextjs'
import Header from "@/components/app-header";
import Footer from "@/components/app-footer";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: "Expense-Hero",
  description: "A full-stack web application to manage and track your personal finances easily.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          <Header />
          <Toaster richColors/>
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
