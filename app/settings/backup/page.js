'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/components/Toast';

export default function BackupPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState('merge');
  const [fileInfo, setFileInfo] = useState(null);
  const [parsedBackup, setParsedBackup] = useState(null);
  const fileInputRef = useRef(null);
  const addToast = useToast();

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) { addToast('내보내기에 실패했습니다.', 'error'); return; }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="(.+?)"/);
      const filename = match ? match[1] : `ksp-erp-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      addToast('백업 파일이 다운로드되었습니다.');
    } catch { addToast('내보내기 중 오류가 발생했습니다.', 'error'); }
    finally { setExporting(false); }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        if (!json.meta || !json.data) { addToast('올바른 백업 파일이 아닙니다.', 'error'); return; }
        setParsedBackup(json);
        setFileInfo({ name: file.name, meta: json.meta });
      } catch { addToast('파일을 읽을 수 없습니다. JSON 형식을 확인해주세요.', 'error'); }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!parsedBackup) return;
    if (importMode === 'replace') {
      const confirmed = confirm(
        '⚠️ 전체 교체 모드입니다.\n\n현재 DB의 거래처, 품목, 주문 데이터가 모두 삭제되고\n백업 데이터로 교체됩니다.\n\n계속하시겠습니까?'
      );
      if (!confirmed) return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsedBackup, mode: importMode }),
      });
      const result = await res.json();
      if (!res.ok) { addToast(result.error || '가져오기에 실패했습니다.', 'error'); return; }
      addToast(`가져오기 완료 (${importMode === 'replace' ? '전체 교체' : '병합'})`, 'success');
      setParsedBackup(null);
      setFileInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch { addToast('가져오기 중 오류가 발생했습니다.', 'error'); }
    finally { setImporting(false); }
  }

  const counts = fileInfo?.meta?.counts;

  return (
    <>
      <header className="main-header"><h1>데이터 백업 / 복원</h1></header>
      <div className="main-body" style={{ maxWidth: 640 }}>

        {/* Export */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#111827' }}>📤 데이터 내보내기 (Export)</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              거래처, 품목, 주문 데이터를 JSON 파일로 다운로드합니다.<br />
              파일명에 날짜/시간이 포함되어 버전 구분이 가능합니다.
            </p>
            <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
              {exporting ? '내보내는 중...' : '📥 백업 파일 다운로드'}
            </button>
          </div>
        </div>

        {/* Import */}
        <div className="card">
          <div style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#111827' }}>📥 데이터 가져오기 (Import)</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              이전에 내보낸 JSON 백업 파일을 선택해 복원합니다.
            </p>

            {/* 파일 선택 */}
            <div className="form-group">
              <label className="form-label">백업 파일 선택</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="form-input"
                onChange={handleFileChange}
                style={{ cursor: 'pointer' }}
              />
            </div>

            {/* 파일 정보 */}
            {fileInfo && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 6, color: '#166534' }}>✅ 파일 확인됨: {fileInfo.name}</div>
                <div style={{ color: '#15803d' }}>
                  백업 일시: {fileInfo.meta.exported_at?.slice(0, 19).replace('T', ' ')}<br />
                  백업자: {fileInfo.meta.exported_by}<br />
                  {counts && (
                    <>데이터: 거래처 {counts.customers}건 · 품목 {counts.products}건 · 주문 {counts.orders}건 · 주문항목 {counts.orderItems}건</>
                  )}
                </div>
              </div>
            )}

            {/* 복원 모드 */}
            <div className="form-group">
              <label className="form-label">복원 방식</label>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="mode" value="merge" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>병합 (추천)</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>없는 것은 추가, 있는 것은 더 최신 버전으로 덮어씁니다</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="mode" value="replace" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 500, color: '#dc2626' }}>전체 교체 ⚠️</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>현재 데이터를 모두 삭제 후 백업으로 교체합니다</div>
                  </div>
                </label>
              </div>
            </div>

            <button
              className={`btn ${importMode === 'replace' ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleImport}
              disabled={!parsedBackup || importing}
            >
              {importing ? '복원 중...' : importMode === 'replace' ? '⚠️ 전체 교체 실행' : '📥 병합 가져오기'}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
