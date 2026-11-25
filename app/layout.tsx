import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/Store";
import { Balloons, CartBar, Footer, Header, SentSheet, Toast } from "@/components/Chrome";

const serif = Playfair_Display({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--f-serif", display: "swap" });
const display = Montserrat({ subsets: ["latin"], weight: ["500", "600", "700", "800", "900"], variable: "--f-display", display: "swap" });
const body = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-body", display: "swap" });

export const metadata: Metadata = {
  title: "Churrascaria Girassol — Marmitas em Palmas-TO",
  description: "Monte sua marmita do seu jeito por R$ 25,00: escolha a carne, a salada e os acompanhamentos e envie o pedido pelo WhatsApp.",
};

export const viewport: Viewport = { themeColor: "#FFFFFF" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${display.variable} ${body.variable}`}>
      <body>
        <noscript><style>{`[data-stagger]>*{opacity:1!important}`}</style></noscript>
        <StoreProvider>
          <div className="shell">
            <Header />
            <main>{children}</main>
            <Footer />
          </div>
          <CartBar />
          <Toast />
          <SentSheet />
          <Balloons />
        </StoreProvider>
      </body>
    </html>
  );
}
