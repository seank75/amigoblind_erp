'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on path change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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
