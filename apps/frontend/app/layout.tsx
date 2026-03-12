import "./globals.css";
import React from "react";
import { ThemeProvider } from "@store/theme-store";
import { Manrope } from "next/font/google";

export const metadata = {
  title: "PrivChat",
  description: "Privacy-focused real-time messenger"
};

const font = Manrope({
  subsets: ["latin", "cyrillic-ext"],
  weight: ["400", "500", "600", "700", "800"]
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="light">
      <body className={font.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
