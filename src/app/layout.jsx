import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { ApiProvider } from "./context/ApiContext";
import { SocketProvider } from "./context/SocketContext";
import QueryProvider from "./providers/QueryProvider";
import { ThemeProvider } from "./context/ThemeContext";
import InstallPWA from "./components/InstallPWA";
import ChunkLoadRecovery from "./components/ChunkLoadRecovery";
import { Toaster } from "react-hot-toast";
import "@/app/lib/api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["monospace"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const appUrl = process.env.NEXT_PUBLIC_RIDER_URL || "https://riders.melachow.com";

export const viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "MelaChow Rider",
    template: "%s | MelaChow Rider",
  },
  description: "Rider operations dashboard for managing MelaChow delivery jobs, availability, earnings, wallet, and notifications.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: appUrl,
  },
  icons: {
    icon: [
      { url: "/logo.jpeg", type: "image/jpeg" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/logo.jpeg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MelaChow Rider",
    startupImage: [{ url: "/logo.jpeg" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased transition-colors duration-300`}>
        <ThemeProvider>
          <ApiProvider>
            <QueryProvider>
              <SocketProvider>
                {children}
                <ChunkLoadRecovery />
                <InstallPWA />
              </SocketProvider>
            </QueryProvider>
          </ApiProvider>
        </ThemeProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            className: "dark:bg-slate-800 dark:text-white",
            style: {
              borderRadius: "16px",
              fontFamily: "var(--font-outfit)",
              fontSize: "14px",
              fontWeight: "600",
            },
          }}
        />
      </body>
    </html>
  );
}
