'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [hasUsers, setHasUsers] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/login').then((r) => r.json()).then((d) => setHasUsers(d.hasUsers));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const mode = hasUsers ? 'login' : 'setup';
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, mode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/');
      router.refresh();
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (hasUsers === null) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.png" alt="AMIGO BLIND" style={{ height: 28, objectFit: 'contain', marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {hasUsers ? 'ERP 시스템 로그인' : '초기 관리자 계정 설정'}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {!hasUsers && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' }}>이름</label>
              <input
                className="form-input"
                placeholder="실명 입력"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' }}>아이디</label>
            <input
              className="form-input"
              placeholder="아이디 입력"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' }}>비밀번호</label>
            <input
              className="form-input"
              type="password"
              placeholder="비밀번호 입력"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: 13, padding: '10px 12px', borderRadius: 8, marginBottom: 16, border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px 0', fontSize: 15, justifyContent: 'center', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? '처리 중...' : hasUsers ? '로그인' : '관리자 계정 생성 및 로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
