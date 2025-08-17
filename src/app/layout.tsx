import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Analytics SaaS",
  description: "Track user behavior and get actionable insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-center" richColors />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
