import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '예약뚝 - 예약 링크, 30초면 끝',
  description: '복잡한 네이버플레이스 등록 없이, SNS에 링크 하나만 달면 예약 완료. 소상공인을 위한 무료 예약 관리 서비스.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF6B35',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}
