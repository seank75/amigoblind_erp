'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  {
    section: '메인',
    items: [
      { href: '/', icon: '📊', label: '대시보드' },
    ],
  },
  {
    section: '거래 관리',
    items: [
      { href: '/orders', icon: '📋', label: '주문 관리' },
      { href: '/orders/new', icon: '➕', label: '신규 주문' },
      { href: '/customers', icon: '🏢', label: '거래처 관리' },
      { href: '/products', icon: '🪟', label: '품목 관리' },
    ],
  },
  {
    section: '출력 / 세금',
    items: [
      { href: '/labels', icon: '🏷️', label: '라벨 프린팅' },
      { href: '/tax-invoice', icon: '🧾', label: '세금계산서' },
    ],
  },
  {
    section: '설정',
    items: [
      { href: '/settings', icon: '⚙️', label: '시스템 설정' },
      { href: '/settings/users', icon: '👥', label: '사용자 관리' },
      { href: '/settings/backup', icon: '💾', label: '백업 / 복원' },
      { href: '/activity-logs', icon: '📋', label: '활동 기록' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setMe(d.user || null)).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      <div className="mobile-header-symbol">
        <img src="/amigo_symbol.png" alt="AMIGO Symbol" />
      </div>

      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img
            src="/logo.png"
            alt="AMIGO BLIND"
            style={{
              height: 18,
              objectFit: 'contain',
            }}
          />
          <button className="mobile-close-btn" onClick={() => setIsOpen(false)}>✕</button>
        </div>
        {me && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{me.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className={`status-badge ${me.role === 'admin' ? 'status-완료' : 'status-접수'}`} style={{ fontSize: 11 }}>
                {me.role === 'admin' ? '관리자' : '일반'}
              </span>
              <button
                onClick={handleLogout}
                style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
              >
                로그아웃
              </button>
            </div>
          </div>
        )}
        <nav className="sidebar-nav">
          {navItems.map((section, idx) => (
            <div key={section.section} style={idx > 0 ? { borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px' } : {}}>
              <div className="nav-section-title">{section.section}</div>
              {section.items.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-link-icon">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
