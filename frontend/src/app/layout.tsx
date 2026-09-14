import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";

const notoSans = Noto_Sans({ variable: "--font-noto-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "TallerTotal",
  description: "Sistema de gestión para talleres mecánicos",
};

// Runs before hydration to avoid a flash of the wrong theme/accent on load.
// Keep in sync with ACCENTS/DEFAULT_ACCENT_ID in lib/theme.ts — duplicated here
// because it must run standalone, before React (and lib/theme.ts) is available.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var mode = localStorage.getItem("tallertotal-color-mode");
    if (mode !== "light" && mode !== "dark") {
      mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (mode === "dark") document.documentElement.classList.add("dark");

    var accent = localStorage.getItem("tallertotal-accent");
    if (accent && accent !== "azul") {
      document.documentElement.classList.add("accent-" + accent);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${notoSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="h-full">
        <ThemeProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
