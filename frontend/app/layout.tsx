import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AfterQuery Interview Platform",
  description: "Professional coding assessment platform for tech recruitment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        
        <main className="main-content">
          {children}
        </main>
        
        <footer className="footer">
          <div className="container">
            <p className="footer-text">
              &copy; {new Date().getFullYear()} AfterQuery Interview Platform. Built for excellence.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
