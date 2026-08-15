import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Laddas ned vid bygget och serveras från vår egen domän, så inget
// hämtas från Google när farmor och farfar öppnar sidan.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-sans",
});

export const metadata: Metadata = {
  title: "TeleHjälp",
  description: "Enkel hjälp för mobil, iPad och appar.",
  // manifestet genereras av src/app/manifest.ts och länkas in automatiskt
  appleWebApp: {
    capable: true,
    title: "TeleHjälp",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-512.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1450a3",
  width: "device-width",
  initialScale: 1,
  // Zoom lämnas medvetet påslagen – många äldre nyper för att förstora.
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={plexSans.variable}>
      <body>
        <div className="mx-auto min-h-screen w-full max-w-xl px-4 pb-16 pt-6">
          {children}
        </div>
      </body>
    </html>
  );
}
