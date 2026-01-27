import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "greek"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hellenic Geographical Society | Ελληνική Γεωγραφική Εταιρεία",
  description: "Promoting geographical science in Greece since 1901 | Προάγοντας τη γεωγραφική επιστήμη στην Ελλάδα από το 1901",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-white text-black min-h-screen font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
