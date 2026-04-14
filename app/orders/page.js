'use client';

import { useState, useEffect } from 'react';
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

const STATUSES = ['전체', '접수', '생산', '출고', '완료', '취소'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      const res = await fetch('/api/orders');
      setOrders(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      addToast(`상태가 '${newStatus}'(으)로 변경되었습니다.`);
      loadOrders();
    } catch (err) { addToast(err.message, 'error'); }
  }

  async function handleDelete(order) {
    if (!confirm(`주문 '${order.order_number}'을 삭제하시겠습니까?`)) return;
    try {
      await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id }),
      });
      addToast('주문이 삭제되었습니다.');
      loadOrders();
    } catch (err) { addToast(err.message, 'error'); }
  }

  const filtered = orders.filter((o) => {
    const matchesSearch = o.order_number?.includes(search) || o.customer_name?.includes(search);
    const matchesStatus = statusFilter === '전체' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <header className="main-header">
        <h1>주문 관리</h1>
        <Link href="/orders/new" className="btn btn-primary">➕ 새 주문</Link>
      </header>
      <div className="main-body">
        <div className="toolbar">
          <div className="toolbar-left">
            <input type="text" className="search-input" placeholder="주문번호, 거래처명 검색..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: 4 }}>
              {STATUSES.map((s) => (
                <button key={s}
                  className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="data-table-wrapper">
            {loading ? (
              <Loading />
            ) : filtered.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>주문번호</th>
                    <th>거래처</th>
                    <th>상태</th>
                    <th>주문일</th>
                    <th>납기일</th>
                    <th style={{ textAlign: 'right' }}>금액</th>
                    <th style={{ textAlign: 'center' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id}>
                      <td className="td-primary">
                        <Link href={`/orders/${o.id}`} style={{ color: 'var(--accent-gold)', textDecoration: 'none' }}>
                          {o.order_number}
                        </Link>
                      </td>
                      <td>{o.customer_name || '-'}</td>
                      <td>
                        <select className="form-select" value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          style={{ padding: '4px 28px 4px 8px', fontSize: '12px', width: 'auto', minWidth: 80 }}>
                          {STATUSES.filter((s) => s !== '전체').map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>{formatDate(o.order_date)}</td>
                      <td>{formatDate(o.delivery_date)}</td>
                      <td className="amount" style={{ textAlign: 'right' }}>{formatAmount(o.total_amount)}원</td>
                      <td style={{ textAlign: 'center' }}>
                        <Link href={`/orders/${o.id}`} className="btn btn-secondary btn-sm" style={{ marginRight: 4 }}>상세</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">주문이 없습니다</div>
                <div className="empty-state-desc">새 주문을 등록해보세요</div>
                <Link href="/orders/new" className="btn btn-primary">➕ 주문 등록</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
