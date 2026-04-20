'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import Loading from '@/components/Loading';
import PasswordConfirmModal from '@/components/PasswordConfirmModal';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', password: '', passwordConfirm: '', role: 'user' });
  const [formError, setFormError] = useState('');
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const addToast = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/auth/me').then((r) => r.json()),
    ]).then(([userList, meData]) => {
      setUsers(userList);
      setMe(meData.user);
    }).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (form.password !== form.passwordConfirm) {
      setFormError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setFormError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, name: form.name, password: form.password, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error, 'error'); return; }
      addToast('사용자가 등록되었습니다.');
      setShowModal(false);
      setForm({ username: '', name: '', password: '', passwordConfirm: '', role: 'user' });
      const updated = await fetch('/api/users').then((r) => r.json());
      setUsers(updated);
    } catch { addToast('오류가 발생했습니다.', 'error'); }
  }

  function requestDelete(user) {
    setPendingDeleteUser(user);
    setShowDeletePasswordModal(true);
  }

  async function executeDelete() {
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pendingDeleteUser.id }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error, 'error'); return; }
      addToast('사용자가 삭제되었습니다.');
      setUsers((prev) => prev.filter((u) => u.id !== pendingDeleteUser.id));
    } catch { addToast('오류가 발생했습니다.', 'error'); }
    finally { setPendingDeleteUser(null); }
  }

  const isAdmin = me?.role === 'admin';

  return (
    <>
      <header className="main-header"><h1>사용자 관리</h1></header>
      <div className="main-body">
        {isAdmin && (
          <div className="toolbar">
            <div className="toolbar-left" />
            <div className="toolbar-right">
              <button className="btn btn-primary btn-add" onClick={() => { setForm({ username: '', name: '', password: '', passwordConfirm: '', role: 'user' }); setFormError(''); setShowModal(true); }}><span className="btn-add-icon">+</span> 사용자 등록</button>
            </div>
          </div>
        )}

        <div className="card">
          <div className="data-table-wrapper">
            {loading ? <Loading /> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>아이디</th>
                    <th>권한</th>
                    <th>등록일</th>
                    {isAdmin && <th style={{ textAlign: 'center' }}>관리</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="td-primary">{u.name} {u.id === me?.id && <span style={{ color: '#6b7280', fontSize: 12 }}>(나)</span>}</td>
                      <td>{u.username}</td>
                      <td>
                        <span className={`status-badge ${u.role === 'admin' ? 'status-완료' : 'status-접수'}`}>
                          {u.role === 'admin' ? '관리자' : '일반'}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                      {isAdmin && (
                        <td style={{ textAlign: 'center' }}>
                          {u.id !== me?.id && (
                            <button className="btn btn-danger btn-sm" onClick={() => requestDelete(u)}>삭제</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>사용자 등록</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">이름 *</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">아이디 *</label>
                    <input className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">비밀번호 *</label>
                    <input className="form-input" type="password" value={form.password}
                      onChange={(e) => { setForm({ ...form, password: e.target.value }); setFormError(''); }} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">비밀번호 확인 *</label>
                    <input
                      className={`form-input${formError ? ' form-input-error' : ''}`}
                      type="password"
                      value={form.passwordConfirm}
                      onChange={(e) => { setForm({ ...form, passwordConfirm: e.target.value }); setFormError(''); }}
                      required
                    />
                    {formError && <p className="form-error-msg">⚠ {formError}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">권한</label>
                    <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="user">일반</option>
                      <option value="admin">관리자</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                  <button type="submit" className="btn btn-primary">등록</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeletePasswordModal && (
          <PasswordConfirmModal
            onSuccess={() => { executeDelete(); }}
            onClose={() => { setShowDeletePasswordModal(false); setPendingDeleteUser(null); }}
          />
        )}
      </div>
    </>
  );
}
