'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function NewOrderPage() {
  const router = useRouter();
  const addToast = useToast();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    memo: '',
    status: '접수',
  });
  const [items, setItems] = useState([
    { product_id: '', product_name: '', width: '', height: '', color: '', quantity: 1, unit_price: 0, amount: 0, memo: '' },
  ]);

  useEffect(() => {
    fetch('/api/customers').then((r) => r.json()).then(setCustomers);
    fetch('/api/products').then((r) => r.json()).then(setProducts);
  }, []);

  function addItem() {
    setItems([...items, { product_id: '', product_name: '', width: '', height: '', color: '', quantity: 1, unit_price: 0, amount: 0, memo: '' }]);
  }

  function removeItem(index) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index, field, value) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'product_id' && value) {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        updated[index].product_name = product.name;
        updated[index].unit_price = product.unit_price;
      }
    }

    // Recalculate amount
    const qty = parseInt(updated[index].quantity) || 1;
    const price = parseInt(updated[index].unit_price) || 0;
    updated[index].amount = qty * price;

    setItems(updated);
  }

  function calcTotal() {
    return items.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
  }

  function calcTax() {
    return Math.round(calcTotal() * 0.1);
  }

  function formatAmount(amount) {
    return new Intl.NumberFormat('ko-KR').format(amount || 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.customer_id) { addToast('거래처를 선택해주세요.', 'error'); return; }
    if (items.some((item) => !item.product_name.trim())) {
      addToast('품목명을 입력해주세요.', 'error'); return;
    }

    const total = calcTotal();
    const tax = calcTax();

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          customer_id: parseInt(form.customer_id),
          total_amount: total,
          tax_amount: tax,
          items: items.map((item) => ({
            ...item,
            product_id: item.product_id ? parseInt(item.product_id) : null,
            width: parseInt(item.width) || 0,
            height: parseInt(item.height) || 0,
            quantity: parseInt(item.quantity) || 1,
            unit_price: parseInt(item.unit_price) || 0,
            amount: parseInt(item.amount) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(`주문이 등록되었습니다. (${data.order_number})`);
      router.push('/orders');
    } catch (err) { addToast(err.message, 'error'); }
  }

  return (
    <>
      <header className="main-header"><h1>신규 주문 등록</h1></header>
      <div className="main-body">
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2>기본 정보</h2></div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">거래처 *</label>
                  <select className="form-select" value={form.customer_id}
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required>
                    <option value="">거래처 선택</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.company_name} {c.business_number ? `(${c.business_number})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">상태</label>
                  <select className="form-select" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {['접수', '생산', '출고', '완료'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">주문일</label>
                  <input className="form-input" type="date" value={form.order_date}
                    onChange={(e) => setForm({ ...form, order_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">납기일</label>
                  <input className="form-input" type="date" value={form.delivery_date}
                    onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">메모</label>
                <textarea className="form-textarea" value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="주문 관련 메모" />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2>주문 품목</h2>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>➕ 항목 추가</button>
            </div>
            <div className="card-body" style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={{ width: 180 }}>품목</th>
                    <th style={{ width: 90 }}>가로(mm)</th>
                    <th style={{ width: 90 }}>세로(mm)</th>
                    <th style={{ width: 100 }}>색상</th>
                    <th style={{ width: 60 }}>수량</th>
                    <th style={{ width: 100 }}>단가</th>
                    <th style={{ width: 100, textAlign: 'right' }}>금액</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <select className="form-select" value={item.product_id}
                          onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                          style={{ padding: '6px 8px', fontSize: 13 }}>
                          <option value="">직접 입력</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        {!item.product_id && (
                          <input className="form-input" value={item.product_name}
                            onChange={(e) => updateItem(i, 'product_name', e.target.value)}
                            placeholder="품목명" style={{ marginTop: 4, padding: '6px 8px', fontSize: 13 }} />
                        )}
                      </td>
                      <td>
                        <input className="form-input" type="number" value={item.width}
                          onChange={(e) => updateItem(i, 'width', e.target.value)}
                          style={{ padding: '6px 8px', fontSize: 13 }} />
                      </td>
                      <td>
                        <input className="form-input" type="number" value={item.height}
                          onChange={(e) => updateItem(i, 'height', e.target.value)}
                          style={{ padding: '6px 8px', fontSize: 13 }} />
                      </td>
                      <td>
                        <input className="form-input" value={item.color}
                          onChange={(e) => updateItem(i, 'color', e.target.value)}
                          placeholder="색상" style={{ padding: '6px 8px', fontSize: 13 }} />
                      </td>
                      <td>
                        <input className="form-input" type="number" min="1" value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          style={{ padding: '6px 8px', fontSize: 13 }} />
                      </td>
                      <td>
                        <input className="form-input" type="number" value={item.unit_price}
                          onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                          style={{ padding: '6px 8px', fontSize: 13 }} />
                      </td>
                      <td className="amount" style={{ textAlign: 'right' }}>{formatAmount(item.amount)}원</td>
                      <td>
                        {items.length > 1 && (
                          <button type="button" className="btn btn-danger btn-icon btn-sm"
                            onClick={() => removeItem(i)}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 20, textAlign: 'right', fontSize: 15 }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)', marginRight: 16 }}>공급가액</span>
                  <span className="amount">{formatAmount(calcTotal())}원</span>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)', marginRight: 16 }}>부가세(10%)</span>
                  <span className="amount">{formatAmount(calcTax())}원</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, paddingTop: 8, borderTop: '1px solid var(--border-default)' }}>
                  <span style={{ color: 'var(--accent-gold)', marginRight: 16 }}>합계</span>
                  <span className="amount">{formatAmount(calcTotal() + calcTax())}원</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/orders')}>취소</button>
            <button type="submit" className="btn btn-primary">📋 주문 등록</button>
          </div>
        </form>
      </div>
    </>
  );
}
