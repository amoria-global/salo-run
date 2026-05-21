import type { Metadata } from "next";
import { Pragati_Narrow } from "next/font/google";
import "./globals.css";
// bootstrap-icons was dropped from package.json in PR #162; the webfont is now
// loaded via the CDN <link> in the <head> below. CSP already whitelists
// cdn.jsdelivr.net in style-src and font-src.
import { DashboardAuthProvider } from "./providers/AuthProvider";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProfileProvider } from "./context/UserProfileContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { PermissionProvider } from "./lib/usePermissions";
import PasswordChangeGate from "./components/PasswordChangeGate";
import PlatformAlert from "./components/PlatformAlert";

const pragatiNarrow = Pragati_Narrow({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pragati-narrow",
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
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body className={`${pragatiNarrow.variable} font-sans antialiased`}>
        <DashboardAuthProvider>
          <PermissionProvider>
            <ThemeProvider>
              <CurrencyProvider>
                <UserProfileProvider>
                  {/* Forced first-login password change for invited team
                      members. Fires on every dashboard route except
                      /user/auth/* so login/reset/change-password itself
                      stay reachable. */}
                  <PasswordChangeGate />
                  {children}
                  {/* Global platform alert — replaces native browser alert() with brand-styled modal. */}
                  <PlatformAlert />
                </UserProfileProvider>
              </CurrencyProvider>
            </ThemeProvider>
          </PermissionProvider>
        </DashboardAuthProvider>
      </body>
    </html>
  );
}
