'use client';

import { useState, useEffect } from 'react';
import Loading from '@/components/Loading';

const ACTION_LABELS = {
  login: '로그인',
  logout: '로그아웃',
  customer_create: '거래처 등록',
  customer_update: '거래처 수정',
  customer_delete: '거래처 삭제',
  product_create: '품목 등록',
  product_update: '품목 수정',
  product_delete: '품목 삭제',
  order_create: '주문 등록',
  order_update: '주문 수정',
  order_delete: '주문 삭제',
  order_status_change: '주문 상태 변경',
  user_create: '사용자 등록',
  user_delete: '사용자 삭제',
  settings_update: '설정 변경',
  data_export: '데이터 내보내기',
  data_import: '데이터 가져오기',
};

const ACTION_COLORS = {
  login: 'status-완료',
  logout: 'status-접수',
  customer_create: 'status-생산',
  customer_update: 'status-출고',
  customer_delete: 'status-취소',
  product_create: 'status-생산',
  product_update: 'status-출고',
  product_delete: 'status-취소',
  order_create: 'status-생산',
  order_update: 'status-출고',
  order_delete: 'status-취소',
  order_status_change: 'status-출고',
  user_create: 'status-생산',
  user_delete: 'status-취소',
  settings_update: 'status-접수',
  data_export: 'status-완료',
  data_import: 'status-생산',
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activity-logs')
      .then((r) => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  function formatDate(dt) {
    return new Date(dt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  return (
    <>
      <header className="main-header"><h1>활동 기록</h1></header>
      <div className="main-body">
        <div className="card">
          <div className="data-table-wrapper">
            {loading ? <Loading /> : logs.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>일시</th>
                    <th>사용자</th>
                    <th>작업</th>
                    <th>상세</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{formatDate(log.created_at)}</td>
                      <td>{log.user_name || '-'}</td>
                      <td>
                        <span className={`status-badge ${ACTION_COLORS[log.action] || 'status-접수'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td style={{ color: '#6b7280', fontSize: 13 }}>{log.detail || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">활동 기록이 없습니다</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
