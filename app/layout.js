import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'KSP ERP - 블라인드 제조 관리 시스템',
  description: '블라인드 제조업을 위한 ERP 시스템. 주문 관리, 세금계산서 발행, 라벨 프린팅',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>
        <ToastProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
