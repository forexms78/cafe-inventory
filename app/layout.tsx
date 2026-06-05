import type { Metadata } from "next";
import { Jua, Noto_Sans_KR } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const jua = Jua({
  variable: "--font-jua",
  subsets: ["latin"],
  weight: "400",
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: '재고 관리',
  description: '디저트39 신사역점 재고관리',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '재고관리',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${jua.variable} ${notoSansKR.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-pink-50/30" style={{ fontFamily: 'var(--font-noto), sans-serif' }}>
        {/* 테마 선적용 — 첫 페인트 전에 data-theme 설정으로 색 깜빡임(FOUC) 방지 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cafe-theme');var v=(t==='dark'||t==='usagi')?t:'pink';var d=document.documentElement;d.setAttribute('data-theme',v);d.classList.toggle('dark',v==='dark');}catch(e){}})();`,
          }}
        />
        <div
          className="fixed inset-0 -z-10 pointer-events-none"
          style={{
            backgroundImage: "url('/bg-pattern.png')",
            backgroundSize: '90px 90px',
            backgroundRepeat: 'repeat',
            opacity: 0.07,
          }}
        />
        {/* 우사기 테마 배경 워터마크 — CSS로 우사기일 때만 표시 */}
        <div className="usagi-watermark -z-10" aria-hidden="true" />
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
