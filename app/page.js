'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function formatAmount(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <header className="main-header"><h1>대시보드</h1></header>
        <div className="main-body">
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-title">로딩 중...</div>
          </div>
        </div>
      </>
    );
  }

  const statusMap = {};
  (stats?.statusCounts || []).forEach((s) => {
    statusMap[s.status] = s.cnt;
  });

  return (
    <>
      <header className="main-header">
        <h1>대시보드</h1>
        <Link href="/orders/new" className="btn btn-primary">
          ➕ 새 주문
        </Link>
      </header>
      <div className="main-body">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <div className="stat-label">전체 주문</div>
            <div className="stat-value">{formatAmount(stats?.totalOrders)}</div>
            <div className="stat-sub">건</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔄</span>
            <div className="stat-label">진행중 주문</div>
            <div className="stat-value">{formatAmount(stats?.activeOrders)}</div>
            <div className="stat-sub">접수 {statusMap['접수'] || 0} · 생산 {statusMap['생산'] || 0} · 출고 {statusMap['출고'] || 0}</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div className="stat-label">이번달 매출</div>
            <div className="stat-value">{formatAmount(stats?.monthlyRevenue)}</div>
            <div className="stat-sub">원</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🏢</span>
            <div className="stat-label">거래처</div>
            <div className="stat-value">{formatAmount(stats?.totalCustomers)}</div>
            <div className="stat-sub">곳</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>최근 주문</h2>
            <Link href="/orders" className="btn btn-secondary btn-sm">
              전체보기 →
            </Link>
          </div>
          <div className="data-table-wrapper">
            {stats?.recentOrders?.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>주문번호</th>
                    <th>거래처</th>
                    <th>상태</th>
                    <th>주문일</th>
                    <th style={{ textAlign: 'right' }}>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="td-primary">
                        <Link href={`/orders/${order.id}`} style={{ color: 'var(--accent-gold)', textDecoration: 'none' }}>
                          {order.order_number}
                        </Link>
                      </td>
                      <td>{order.customer_name || '-'}</td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{formatDate(order.order_date)}</td>
                      <td style={{ textAlign: 'right' }} className="amount">
                        {formatAmount(order.total_amount)}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">아직 주문이 없습니다</div>
                <div className="empty-state-desc">새 주문을 등록해보세요</div>
                <Link href="/orders/new" className="btn btn-primary">
                  ➕ 주문 등록
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
