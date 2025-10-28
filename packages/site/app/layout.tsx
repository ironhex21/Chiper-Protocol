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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // AGGRESSIVE error suppression - must run FIRST
              (function() {
                var suppressError = function(e) {
                  var err = e.reason || e.error;
                  
                  // Suppress [object Object] and user rejections
                  if (!err || 
                      err === '[object Object]' ||
                      String(err) === '[object Object]' ||
                      (typeof err === 'object' && Object.keys(err).length === 0) ||
                      err.code === 'ACTION_REJECTED' || 
                      err.code === 4001 ||
                      (err.message && (
                        err.message === '[object Object]' ||
                        err.message.includes('user rejected') || 
                        err.message.includes('User denied') ||
                        err.message.includes('ACTION_REJECTED')
                      ))) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                  }
                };
                
                // Add multiple listeners with capture phase
                window.addEventListener('unhandledrejection', suppressError, true);
                window.addEventListener('error', function(e) {
                  if (e.message === '[object Object]' || !e.message) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                  }
                }, true);
                
                // Override console.error to filter [object Object]
                var originalError = console.error;
                console.error = function() {
                  var args = Array.prototype.slice.call(arguments);
                  var hasObjectObject = args.some(function(arg) {
                    return String(arg) === '[object Object]' || arg === '[object Object]';
                  });
                  if (!hasObjectObject) {
                    originalError.apply(console, args);
                  }
                };
              })();
            `,
          }}
        />
      </head>
      <body className={`bg-white text-foreground antialiased`}>
        <div className="fixed inset-0 w-full h-full bg-white z-[-20] min-w-[850px]"></div>
        <main className="flex flex-col max-w-screen-lg mx-auto pb-20 min-w-[850px]">
          <nav className="flex w-full px-3 md:px-0 h-fit py-10 justify-between items-center">
            <div className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              CHIPER PROTOCOL
            </div>
          </nav>
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
