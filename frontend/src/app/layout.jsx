import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import GoogleProvider from "@/components/GoogleProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  title: "ShopCraft | Premium Multi-Vendor Marketplace",
  description: "Handcrafted & Curated E-Commerce Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body
        className={`${plusJakartaSans.className} bg-linear-to-br from-[#EAE8FF] via-[#F2FAF4] to-[#FDF0F6] min-h-screen text-slate-900 antialiased selection:bg-rose-200 selection:text-rose-900`}
      >
        <GoogleProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </main>
              <Footer />
            </CartProvider>
          </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
