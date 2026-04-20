'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import Loading from '@/components/Loading';
import PasswordConfirmModal from '@/components/PasswordConfirmModal';

const CATEGORIES = ['롤블라인드', '버티칼', '우드', '허니콤', '콤비', '베네시안', '기타'];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(null);
  const addToast = useToast();

  const emptyForm = { name: '', category: '롤블라인드', unit_price: 0, description: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      setProducts(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function openNew() {
    setPendingOpen('new');
    setShowPasswordModal(true);
  }

  function openEdit(product) {
    setPendingOpen(product);
    setShowPasswordModal(true);
  }

  function onPasswordSuccess() {
    if (pendingOpen === 'new') {
      setForm(emptyForm);
      setEditingProduct(null);
    } else {
      const product = pendingOpen;
      setForm({
        name: product.name, category: product.category,
        unit_price: product.unit_price, description: product.description || '',
      });
      setEditingProduct(product);
    }
    setPendingOpen(null);
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { addToast('품명을 입력해주세요.', 'error'); return; }

    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      loadProducts();
      addToast(editingProduct ? '품목이 수정되었습니다.' : '품목이 등록되었습니다.');
      const done = confirm('저장되었습니다. 창을 닫으시겠습니까?');
      if (done) {
        setShowModal(false);
      } else {
        setForm(emptyForm);
        setEditingProduct(null);
      }
    } catch (err) { addToast(err.message, 'error'); }
  }

  async function handleDelete(product) {
    if (!confirm(`'${product.name}' 품목을 삭제하시겠습니까?`)) return;
    try {
      await fetch('/api/products', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id }),
      });
      addToast('품목이 삭제되었습니다.');
      loadProducts();
    } catch (err) { addToast(err.message, 'error'); }
  }

  const filtered = products.filter((p) =>
    p.name?.includes(search) || p.category?.includes(search)
  );

  function formatPrice(price) {
    return new Intl.NumberFormat('ko-KR').format(price || 0);
  }

  return (
    <>
      <header className="main-header"><h1>품목 관리</h1></header>
      <div className="main-body">
        <div className="toolbar">
          <div className="toolbar-left">
            <input type="text" className="search-input" placeholder="품명, 카테고리 검색..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openNew}>➕ 품목 등록</button>
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
                    <th>품명</th>
                    <th>카테고리</th>
                    <th style={{ textAlign: 'right' }}>기본 단가</th>
                    <th>설명</th>
                    <th style={{ textAlign: 'center' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="td-primary">{p.name}</td>
                      <td><span className="status-badge status-생산">{p.category}</span></td>
                      <td className="amount" style={{ textAlign: 'right' }}>{formatPrice(p.unit_price)}원</td>
                      <td>{p.description || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)} style={{ marginRight: 4 }}>수정</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🪟</div>
                <div className="empty-state-title">품목이 없습니다</div>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingProduct ? '품목 수정' : '품목 등록'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">품명 *</label>
                      <input className="form-input" value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">카테고리</label>
                      <select className="form-select" value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">기본 단가 (원)</label>
                    <input className="form-input" type="number" value={form.unit_price}
                      onChange={(e) => setForm({ ...form, unit_price: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">설명</label>
                    <textarea className="form-textarea" value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                  <button type="submit" className="btn btn-primary">{editingProduct ? '수정' : '등록'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <PasswordConfirmModal
            onSuccess={onPasswordSuccess}
            onClose={() => { setShowPasswordModal(false); setPendingOpen(null); }}
          />
        )}
      </div>
    </>
  );
}
