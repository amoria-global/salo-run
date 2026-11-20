import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, Pragati_Narrow, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./glass.css";
import "./glass-shell.css";
import "./glass-home.css";
import "./glass-referral.css";
import "./glass-pages.css";
import "./glass-ui.css";
import { HEAD_SCRIPT, ICONS_CSS } from "./lib/uiGlass";
// Bootstrap Icons 1.11.3 is self-hosted under public/vendor (no CDN): preloaded here, applied by the head script so
// the stylesheet never blocks the first paint (app/lib/uiGlass.ts).
import { DashboardAuthProvider } from "./providers/AuthProvider";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProfileProvider } from "./context/UserProfileContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { LanguageProvider } from "./context/LanguageContext";
import { PermissionProvider } from "./lib/usePermissions";
import { WorkspaceProvider } from "./providers/WorkspaceProvider";
import PasswordChangeGate from "./components/PasswordChangeGate";
import PlatformAlert from "./components/PlatformAlert";
import ErrorHost from "./components/errors/ErrorHost";
import AppInstallWizard from "./components/AppInstallWizard";

const pragatiNarrow = Pragati_Narrow({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pragati-narrow",
});

// Compact Glass type (app/glass.css): Space Grotesk for titles and numbers, Inter for text. Self-hosted by next/font
// and not preloaded, so a browser only fetches them when a ui-glass page uses them; the old UI never does.
const spaceGrotesk = Space_Grotesk({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
  preload: false,
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Connekyt Dashboard",
  description: "Dashboard application for Connekyt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the head script sets data-theme and the ui-glass class before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
        <link rel="preload" as="style" href={ICONS_CSS} />
      </head>
      <body className={`${pragatiNarrow.variable} ${spaceGrotesk.variable} ${inter.variable} font-sans antialiased`}>
        <DashboardAuthProvider>
          <PermissionProvider>
            <WorkspaceProvider>
            <ThemeProvider>
              <LanguageProvider>
                <CurrencyProvider>
                  <UserProfileProvider>
                    {/* Forced first-login password change for invited team
                        members. Fires on every dashboard route except
                        /user/auth/* so login/reset/change-password itself
                        stay reachable. */}
                    <PasswordChangeGate />
                    {children}
                    {/* Global platform alert: replaces native browser alert() with brand-styled modal. */}
                    <PlatformAlert />
                    {/* Toasts and decision dialogs raised by showError() from any page. */}
                    <ErrorHost />
                    {/* Get-the-app wizard for a collaboration invite opened on a phone. */}
                    <Suspense fallback={null}>
                      <AppInstallWizard />
                    </Suspense>
                  </UserProfileProvider>
                </CurrencyProvider>
              </LanguageProvider>
            </ThemeProvider>
            </WorkspaceProvider>
          </PermissionProvider>
        </DashboardAuthProvider>
      </body>
    </html>
  );
}
