'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import Loading from '@/components/Loading';

export default function TaxInvoicePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => setOrders(data.filter((o) => o.status !== '취소')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function formatAmount(amount) {
    return new Intl.NumberFormat('ko-KR').format(amount || 0);
  }

  function handleIssue(order) {
    addToast('팝빌 API 키를 설정 페이지에서 먼저 등록해주세요.', 'error');
  }

  return (
    <>
      <header className="main-header"><h1>세금계산서 발행</h1></header>
      <div className="main-body">
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{
              background: 'rgba(201, 168, 76, 0.08)',
              border: '1px solid rgba(201, 168, 76, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px 20px',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}>
              <strong style={{ color: 'var(--accent-gold)' }}>💡 팝빌 API 연동 안내</strong>
              <p style={{ margin: '8px 0 0' }}>
                전자세금계산서 발행을 위해서는 <a href="https://www.popbill.com" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent-blue-light)' }}>팝빌(PopBill)</a>에 회원가입 후 API 키를 발급받아야 합니다.
                발급받은 LinkID와 SecretKey를 <a href="/settings" style={{ color: 'var(--accent-blue-light)' }}>설정</a> 페이지에서 등록해주세요.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>세금계산서 발행 대상 주문</h2>
          </div>
          <div className="data-table-wrapper">
            {loading ? (
              <Loading />
            ) : orders.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>주문번호</th>
                    <th>거래처</th>
                    <th>주문일</th>
                    <th style={{ textAlign: 'right' }}>공급가액</th>
                    <th style={{ textAlign: 'right' }}>세액</th>
                    <th style={{ textAlign: 'right' }}>합계</th>
                    <th style={{ textAlign: 'center' }}>발행</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="td-primary">{o.order_number}</td>
                      <td>{o.customer_name || '-'}</td>
                      <td>{o.order_date || '-'}</td>
                      <td className="amount" style={{ textAlign: 'right' }}>{formatAmount(o.total_amount)}원</td>
                      <td className="amount" style={{ textAlign: 'right' }}>{formatAmount(o.tax_amount)}원</td>
                      <td className="amount" style={{ textAlign: 'right' }}>
                        {formatAmount((o.total_amount || 0) + (o.tax_amount || 0))}원
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleIssue(o)}>
                          🧾 발행
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🧾</div>
                <div className="empty-state-title">발행 대상 주문이 없습니다</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
