import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Noto_Serif_JP, M_PLUS_Rounded_1c, Yomogi } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const mPlusRounded = M_PLUS_Rounded_1c({
  variable: "--font-mplus-rounded",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const yomogi = Yomogi({
  variable: "--font-yomogi",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "おしらせ画 - 白背景の文章画像をかんたん作成",
  description: "SNS投稿用の白背景の文章画像をかんたんに作成できるWebアプリ。テーマやフォント、背景色をカスタマイズして、美しい文章画像を作成・保存できます。AIによる誤字チェックや表現の改善機能も搭載。",
  authors: [{ name: "なな太郎", url: "https://x.com/nxouv" }],
  creator: "なな太郎",
  publisher: "なな太郎",
  metadataBase: new URL("https://oshirasega.nanataro.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://oshirasega.nanataro.app",
    siteName: "おしらせ画",
    title: "おしらせ画 - 白背景の文章画像をかんたん作成",
    description: "SNS投稿用の白背景の文章画像をかんたんに作成できるWebアプリ。テーマやフォント、背景色をカスタマイズ可能。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "おしらせ画",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "おしらせ画 - 白背景の文章画像をかんたん作成",
    description: "SNS投稿用の白背景の文章画像をかんたんに作成できるWebアプリ。",
    creator: "@nxouv",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${notoSerifJP.variable} ${mPlusRounded.variable} ${yomogi.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
