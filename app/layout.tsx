import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { METADATA_DESCRIPTION, METADATA_TITLE } from "@/lib/branding";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: METADATA_TITLE,
  description: METADATA_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrains.variable} h-full`}>
      <body
        className={`${jetbrains.className} min-h-full flex flex-col bg-aegis-bg text-aegis-lime antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}