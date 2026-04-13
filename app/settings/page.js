'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function update(key, value) {
    setSettings({ ...settings, [key]: value });
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('저장 실패');
      addToast('설정이 저장되었습니다.');
    } catch (err) { addToast(err.message, 'error'); }
  }

  if (loading) {
    return (
      <>
        <header className="main-header"><h1>시스템 설정</h1></header>
        <div className="main-body">
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-title">로딩 중...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="main-header"><h1>시스템 설정</h1></header>
      <div className="main-body">
        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2>🏢 사업자 정보</h2></div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">상호명</label>
                  <input className="form-input" value={settings.company_name || ''}
                    onChange={(e) => update('company_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">사업자등록번호</label>
                  <input className="form-input" value={settings.business_number || ''}
                    onChange={(e) => update('business_number', e.target.value)}
                    placeholder="000-00-00000" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">대표자</label>
                  <input className="form-input" value={settings.representative || ''}
                    onChange={(e) => update('representative', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">전화번호</label>
                  <input className="form-input" value={settings.phone || ''}
                    onChange={(e) => update('phone', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">주소</label>
                <input className="form-input" value={settings.address || ''}
                  onChange={(e) => update('address', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">업태</label>
                  <input className="form-input" value={settings.business_type || ''}
                    onChange={(e) => update('business_type', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">종목</label>
                  <input className="form-input" value={settings.business_category || ''}
                    onChange={(e) => update('business_category', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">이메일</label>
                <input className="form-input" type="email" value={settings.email || ''}
                  onChange={(e) => update('email', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2>🧾 팝빌 API 설정</h2></div>
            <div className="card-body">
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 16,
              }}>
                💡 <a href="https://www.popbill.com" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent-blue-light)' }}>팝빌 홈페이지</a>에서 회원가입 후,
                링크허브에서 LinkID와 SecretKey를 발급받으세요.
                테스트 모드에서는 실제 세금계산서가 국세청에 전송되지 않습니다.
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">LinkID</label>
                  <input className="form-input" value={settings.popbill_link_id || ''}
                    onChange={(e) => update('popbill_link_id', e.target.value)}
                    placeholder="팝빌 LinkID" />
                </div>
                <div className="form-group">
                  <label className="form-label">SecretKey</label>
                  <input className="form-input" type="password" value={settings.popbill_secret_key || ''}
                    onChange={(e) => update('popbill_secret_key', e.target.value)}
                    placeholder="팝빌 SecretKey" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <input type="checkbox" checked={settings.popbill_is_test === 'true'}
                    onChange={(e) => update('popbill_is_test', e.target.checked ? 'true' : 'false')}
                    style={{ marginRight: 8, accentColor: 'var(--accent-gold)' }} />
                  테스트 모드 (실제 발행되지 않음)
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">💾 설정 저장</button>
          </div>
        </form>
      </div>
    </>
  );
}
