'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';

function DbOfflineBanner({ onRetry, checking }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '36px 40px',
        maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🔌</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 8 }}>
          데이터베이스 연결이 끊겼습니다
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
          Supabase 프로젝트가 일시정지 상태입니다.<br />
          아래 안내에 따라 복구해 주세요.
        </p>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 14 }}>📋 복구 방법</div>
          {[
            { step: '1', text: <>브라우저에서 <strong>supabase.com</strong> 접속 후 로그인</> },
            { step: '2', text: <>좌측 프로젝트 목록에서 <strong>일시정지된 프로젝트</strong> 선택</> },
            { step: '3', text: <><strong style={{ color: '#16a34a' }}>"Restore project"</strong> 버튼 클릭</> },
            { step: '4', text: <>약 <strong>1~2분</strong> 대기 후 아래 "다시 연결 확인" 클릭</> },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <div style={{
                minWidth: 24, height: 24, borderRadius: '50%',
                background: '#3b82f6', color: '#fff',
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{step}</div>
              <div style={{ fontSize: 13, color: '#374151', paddingTop: 3 }}>{text}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#854d0e' }}>
          💡 데이터는 안전하게 보존되어 있습니다. 복구 후 모든 기능이 정상 동작합니다.
        </div>

        <button
          onClick={onRetry}
          disabled={checking}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 8,
            background: checking ? '#93c5fd' : '#3b82f6',
            color: '#fff', fontWeight: 700, fontSize: 14,
            border: 'none', cursor: checking ? 'not-allowed' : 'pointer',
          }}
        >
          {checking ? '🔄 연결 확인 중...' : '🔁 다시 연결 확인'}
        </button>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [dbOffline, setDbOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/health');
      setDbOffline(!res.ok);
    } catch {
      setDbOffline(true);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/login')) return;
    checkHealth();
  }, [pathname, checkHealth]);

  if (pathname.startsWith('/login')) return <>{children}</>;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
      {dbOffline && <DbOfflineBanner onRetry={checkHealth} checking={checking} />}
    </div>
  );
}
