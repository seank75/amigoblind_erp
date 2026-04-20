'use client';

import { useState, useRef, useEffect } from 'react';

export default function PasswordConfirmModal({ onSuccess, onClose, message, warning, danger }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) { setError('비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || '비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>비밀번호 확인</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {warning && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
                ⚠️ {warning}
              </div>
            )}
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              {message || '수정하려면 비밀번호를 입력해주세요.'}
            </p>
            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input
                ref={inputRef}
                className={`form-input${error ? ' form-input-error' : ''}`}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="비밀번호 입력"
                autoComplete="current-password"
              />
              {error && <p className="form-error-msg">⚠ {error}</p>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={loading}>
              {loading ? '확인 중...' : '확인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
