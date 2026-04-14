'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import Loading from '@/components/Loading';

function formatAmount(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error('주문을 찾을 수 없습니다.');
      setOrder(await res.json());
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(id), status: newStatus }),
      });
      addToast(`상태가 '${newStatus}'(으)로 변경되었습니다.`);
      loadOrder();
    } catch (err) { addToast(err.message, 'error'); }
  }

  if (loading) {
    return (
      <>
        <header className="main-header"><h1>주문 상세</h1></header>
        <div className="main-body">
          <Loading />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <header className="main-header"><h1>주문 상세</h1></header>
        <div className="main-body">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <div className="empty-state-title">주문을 찾을 수 없습니다</div>
            <Link href="/orders" className="btn btn-primary" style={{ marginTop: 16 }}>← 주문 목록</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="main-header">
        <h1>주문 상세 — {order.order_number}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/labels" className="btn btn-secondary">🏷️ 라벨</Link>
          <Link href="/orders" className="btn btn-secondary">← 목록</Link>
        </div>
      </header>
      <div className="main-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card">
            <div className="card-header"><h2>주문 정보</h2></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px 16px', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>주문번호</span>
                <span className="td-primary">{order.order_number}</span>
                <span style={{ color: 'var(--text-muted)' }}>상태</span>
                <span>
                  <select className="form-select" value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{ padding: '4px 28px 4px 8px', fontSize: 13, width: 'auto' }}>
                    {['접수', '생산', '출고', '완료', '취소'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>주문일</span>
                <span>{formatDate(order.order_date)}</span>
                <span style={{ color: 'var(--text-muted)' }}>납기일</span>
                <span>{formatDate(order.delivery_date)}</span>
                <span style={{ color: 'var(--text-muted)' }}>메모</span>
                <span>{order.memo || '-'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2>거래처 정보</h2></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px 16px', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>상호명</span>
                <span className="td-primary">{order.customer_name || '-'}</span>
                <span style={{ color: 'var(--text-muted)' }}>사업자번호</span>
                <span>{order.customer_business_number || '-'}</span>
                <span style={{ color: 'var(--text-muted)' }}>대표자</span>
                <span>{order.customer_representative || '-'}</span>
                <span style={{ color: 'var(--text-muted)' }}>전화번호</span>
                <span>{order.customer_phone || '-'}</span>
                <span style={{ color: 'var(--text-muted)' }}>주소</span>
                <span>{order.customer_address || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>주문 품목</h2></div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>품목명</th>
                  <th>가로(mm)</th>
                  <th>세로(mm)</th>
                  <th>색상</th>
                  <th style={{ textAlign: 'right' }}>수량</th>
                  <th style={{ textAlign: 'right' }}>단가</th>
                  <th style={{ textAlign: 'right' }}>금액</th>
                  <th>메모</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td className="td-primary">{item.product_name}</td>
                    <td>{item.width || '-'}</td>
                    <td>{item.height || '-'}</td>
                    <td>{item.color || '-'}</td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td className="amount" style={{ textAlign: 'right' }}>{formatAmount(item.unit_price)}원</td>
                    <td className="amount" style={{ textAlign: 'right' }}>{formatAmount(item.amount)}원</td>
                    <td>{item.memo || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="7" style={{ textAlign: 'right', fontWeight: 600 }}>공급가액</td>
                  <td className="amount" style={{ textAlign: 'right' }}>{formatAmount(order.total_amount)}원</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan="7" style={{ textAlign: 'right', fontWeight: 600 }}>부가세</td>
                  <td className="amount" style={{ textAlign: 'right' }}>{formatAmount(order.tax_amount)}원</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan="7" style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: 'var(--accent-gold)' }}>합계</td>
                  <td className="amount" style={{ textAlign: 'right', fontSize: 16 }}>
                    {formatAmount((order.total_amount || 0) + (order.tax_amount || 0))}원
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
