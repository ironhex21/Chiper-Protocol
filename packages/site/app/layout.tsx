import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Chiper Protocol - Confidential Transfer",
  description: "Confidential Transfer protocol with Fully Homomorphic Encryption",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`zama-bg text-foreground antialiased`}>
        <div className="fixed inset-0 w-full h-full zama-bg z-[-20] min-w-[850px]"></div>
        <main className="flex flex-col max-w-screen-lg mx-auto pb-20 min-w-[850px]">
          <nav className="flex w-full px-3 md:px-0 h-fit py-10 justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Chiper Protocol
            </div>
          </nav>
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
