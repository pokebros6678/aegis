import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "AEGIS — CaliRP",
  description: "Intelligence gathering dashboard for CaliRP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrains.variable} h-full`}>
      <body className={`${jetbrains.className} min-h-full flex flex-col bg-black text-[#39ff14] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}