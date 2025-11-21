import type { Metadata } from "next";
import { Pragati_Narrow } from "next/font/google";
import "./globals.css";

const pragatiNarrow = Pragati_Narrow({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pragati-narrow",
});

export const metadata: Metadata = {
  title: "Connekt Dashboard",
  description: "Dashboard application for Connekt",
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
        {children}
      </body>
    </html>
  );
}
