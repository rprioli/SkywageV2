import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthProvider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Skywage - Airline Salary Calculator",
  description: "Salary calculator for airline cabin crew and pilots",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
