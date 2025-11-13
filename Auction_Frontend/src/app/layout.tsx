import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "../lib/redux/provider"; // <-- new wrapper
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auction App",
  description: "Auction platform for players and teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>{children}</ReduxProvider>
         <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#111827', color: '#ffffff' },
          }}
        />
      </body>
    </html>
  );
}
