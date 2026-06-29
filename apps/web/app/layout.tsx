import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/shared/toast";

export const metadata: Metadata = {
  title: "Vorebase Studio",
  description: "Open-source Backend-as-a-Service platform. Manage your databases, authentication, storage, and APIs from one dashboard.",
  keywords: ["BaaS", "backend", "database", "API", "authentication", "storage"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

