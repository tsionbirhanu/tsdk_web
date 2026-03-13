import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: "Tsedk | Church Member Portal",
  description: "Ethiopian Orthodox Church Member Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="am" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
