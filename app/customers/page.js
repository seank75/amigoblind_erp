'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  const emptyForm = {
    business_number: '', company_name: '', representative: '',
    address: '', business_type: '', business_category: '',
    phone: '', email: '', memo: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }

  function openNew() {
    setForm(emptyForm);
    setEditingCustomer(null);
    setShowModal(true);
  }

  function openEdit(customer) {
    setForm({
      business_number: customer.business_number || '',
      company_name: customer.company_name || '',
      representative: customer.representative || '',
      address: customer.address || '',
      business_type: customer.business_type || '',
      business_category: customer.business_category || '',
      phone: customer.phone || '',
      email: customer.email || '',
      memo: customer.memo || '',
    });
    setEditingCustomer(customer);
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.company_name.trim()) {
      addToast('상호명을 입력해주세요.', 'error');
      return;
    }

    try {
      if (editingCustomer) {
        await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        addToast('거래처가 수정되었습니다.');
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        addToast('거래처가 등록되었습니다.');
      }
      setShowModal(false);
      loadCustomers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handleDelete(customer) {
    if (!confirm(`'${customer.company_name}' 거래처를 삭제하시겠습니까?`)) return;
    try {
      await fetch('/api/customers', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customer.id }),
      });
      addToast('거래처가 삭제되었습니다.');
      loadCustomers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  const filtered = customers.filter((c) =>
    c.company_name?.includes(search) ||
    c.business_number?.includes(search) ||
    c.representative?.includes(search)
  );

  return (
    <>
      <header className="main-header">
        <h1>거래처 관리</h1>
      </header>
      <div className="main-body">
        <div className="toolbar">
          <div className="toolbar-left">
            <input
              type="text" className="search-input"
              placeholder="상호명, 사업자번호, 대표자 검색..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openNew}>
              ➕ 거래처 등록
            </button>
          </div>
        </div>

        <div className="card">
          <div className="data-table-wrapper">
            {filtered.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>상호명</th>
                    <th>사업자번호</th>
                    <th>대표자</th>
                    <th>전화번호</th>
                    <th>업태/종목</th>
                    <th style={{ textAlign: 'center' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td className="td-primary">{c.company_name}</td>
                      <td>{c.business_number || '-'}</td>
                      <td>{c.representative || '-'}</td>
                      <td>{c.phone || '-'}</td>
                      <td>{[c.business_type, c.business_category].filter(Boolean).join(' / ') || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)} style={{ marginRight: 4 }}>수정</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🏢</div>
                <div className="empty-state-title">{loading ? '로딩 중...' : '거래처가 없습니다'}</div>
                {!loading && <div className="empty-state-desc">새 거래처를 등록해보세요</div>}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCustomer ? '거래처 수정' : '거래처 등록'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">상호명 *</label>
                      <input className="form-input" value={form.company_name}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                        placeholder="상호명 입력" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">사업자번호</label>
                      <input className="form-input" value={form.business_number}
                        onChange={(e) => setForm({ ...form, business_number: e.target.value })}
                        placeholder="000-00-00000" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">대표자</label>
                      <input className="form-input" value={form.representative}
                        onChange={(e) => setForm({ ...form, representative: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">전화번호</label>
                      <input className="form-input" value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">주소</label>
                    <input className="form-input" value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">업태</label>
                      <input className="form-input" value={form.business_type}
                        onChange={(e) => setForm({ ...form, business_type: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">종목</label>
                      <input className="form-input" value={form.business_category}
                        onChange={(e) => setForm({ ...form, business_category: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">이메일</label>
                    <input className="form-input" type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">메모</label>
                    <textarea className="form-textarea" value={form.memo}
                      onChange={(e) => setForm({ ...form, memo: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                  <button type="submit" className="btn btn-primary">{editingCustomer ? '수정' : '등록'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
