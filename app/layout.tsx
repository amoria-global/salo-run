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
          <ThemeProvider>
            <CurrencyProvider>
              <UserProfileProvider>
                {children}
              </UserProfileProvider>
            </CurrencyProvider>
          </ThemeProvider>
        </DashboardAuthProvider>
      </body>
    </html>
  );
}
