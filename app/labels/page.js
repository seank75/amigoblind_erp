'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';
import Loading from '@/components/Loading';

function formatAmount(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount || 0);
}

export default function LabelsPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);
  const addToast = useToast();

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => {
        // Filter active orders
        setOrders(data.filter((o) => o.status !== '취소' && o.status !== '완료'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function toggleOrder(orderId) {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }

  function selectAll() {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  }

  async function handlePrint() {
    if (selectedOrders.length === 0) {
      addToast('인쇄할 주문을 선택해주세요.', 'error');
      return;
    }

    // Fetch full order details for selected orders
    const details = await Promise.all(
      selectedOrders.map((id) =>
        fetch(`/api/orders/${id}`).then((r) => r.json())
      )
    );

    // Create print window
    const printWindow = window.open('', '_blank');
    const labelsHtml = details
      .map((order) => {
        const itemsHtml = (order.items || [])
          .map(
            (item, idx) => `
          <tr>
            <td style="padding:4px 8px;border-bottom:1px solid #ddd;font-size:12px;">${idx + 1}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #ddd;font-size:12px;font-weight:600;">${item.product_name}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #ddd;font-size:12px;">${item.width || '-'} × ${item.height || '-'}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #ddd;font-size:12px;">${item.color || '-'}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #ddd;font-size:12px;text-align:right;">${item.quantity}</td>
          </tr>
        `
          )
          .join('');

        return `
        <div style="page-break-after:always;width:100mm;padding:8mm;font-family:'Pretendard Variable',sans-serif;border:1px dashed #ccc;margin-bottom:4mm;">
          <div style="text-align:center;font-size:16px;font-weight:800;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:8px;">
            KSP 블라인드 — 발주서
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;">
            <span><strong>주문번호:</strong> ${order.order_number}</span>
            <span><strong>날짜:</strong> ${order.order_date || '-'}</span>
          </div>
          <div style="font-size:12px;margin-bottom:4px;"><strong>거래처:</strong> ${order.customer_name || '-'}</div>
          <div style="font-size:12px;margin-bottom:8px;"><strong>납기일:</strong> ${order.delivery_date || '-'}</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="padding:4px 8px;text-align:left;font-size:11px;border-bottom:2px solid #333;">No</th>
                <th style="padding:4px 8px;text-align:left;font-size:11px;border-bottom:2px solid #333;">품목</th>
                <th style="padding:4px 8px;text-align:left;font-size:11px;border-bottom:2px solid #333;">규격</th>
                <th style="padding:4px 8px;text-align:left;font-size:11px;border-bottom:2px solid #333;">색상</th>
                <th style="padding:4px 8px;text-align:right;font-size:11px;border-bottom:2px solid #333;">수량</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          ${order.memo ? `<div style="font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:4px;"><strong>메모:</strong> ${order.memo}</div>` : ''}
        </div>
      `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>발주 라벨 - KSP ERP</title>
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet"/>
        <style>
          @media print { @page { size: 100mm auto; margin: 0; } body { margin: 0; } }
          body { font-family: 'Pretendard Variable', sans-serif; }
        </style>
      </head>
      <body>${labelsHtml}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }

  return (
    <>
      <header className="main-header">
        <h1>라벨 프린팅</h1>
        <button className="btn btn-primary" onClick={handlePrint}>
          🖨️ 선택 주문 인쇄 ({selectedOrders.length}건)
        </button>
      </header>
      <div className="main-body">
        <div className="card">
          <div className="card-header">
            <h2>진행중인 주문 목록</h2>
            <button className="btn btn-secondary btn-sm" onClick={selectAll}>
              {selectedOrders.length === orders.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          <div className="data-table-wrapper">
            {loading ? (
              <Loading />
            ) : orders.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>선택</th>
                    <th>주문번호</th>
                    <th>거래처</th>
                    <th>상태</th>
                    <th>주문일</th>
                    <th>납기일</th>
                    <th style={{ textAlign: 'right' }}>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} onClick={() => toggleOrder(o.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <input type="checkbox" checked={selectedOrders.includes(o.id)}
                          onChange={() => toggleOrder(o.id)}
                          style={{ width: 16, height: 16, accentColor: 'var(--accent-gold)' }} />
                      </td>
                      <td className="td-primary">{o.order_number}</td>
                      <td>{o.customer_name || '-'}</td>
                      <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                      <td>{o.order_date || '-'}</td>
                      <td>{o.delivery_date || '-'}</td>
                      <td className="amount" style={{ textAlign: 'right' }}>{formatAmount(o.total_amount)}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🏷️</div>
                <div className="empty-state-title">진행중인 주문이 없습니다</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
