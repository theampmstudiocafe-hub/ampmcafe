import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THE AM:PM STUDIO | Yoga Studio & Café • Koregaon Park, Pune",
  description:
    "From sunrise vinyasa to sunset sound baths, ceremonial matcha to evening nourishment. Welcome to THE AM:PM STUDIO in Koregaon Park, Pune.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-studio-linen text-studio-slate antialiased">
        {children}
      </body>
    </html>
  );
}
