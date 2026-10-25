import React, { useState } from 'react';
import type { AuditLog } from '../types';
import { ShieldAlert, RefreshCw, Filter, Clock, User, FileText } from 'lucide-react';

interface AuditViewerProps {
  logs: AuditLog[];
  onRefresh: () => void;
  isPolling: boolean;
  setIsPolling: (val: boolean) => void;
  isLoading: boolean;
}

export const AuditViewer: React.FC<AuditViewerProps> = ({
  logs,
  onRefresh,
  isPolling,
  setIsPolling,
  isLoading,
}) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'ALL') return true;
    return log.hanhdong.toUpperCase() === filterAction.toUpperCase();
  });

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act === 'INSERT') return <span className="badge badge-green">INSERT</span>;
    if (act === 'UPDATE') return <span className="badge badge-amber">UPDATE</span>;
    if (act === 'DELETE') return <span className="badge badge-red">DELETE</span>;
    return <span className="badge badge-blue">{action}</span>;
  };

  const getTableBadge = (tbl: string) => {
    const t = tbl.toUpperCase();
    if (t === 'VE') return <span className="badge badge-purple">VE</span>;
    if (t === 'DON_DAT_VE') return <span className="badge badge-blue">DON_DAT_VE</span>;
    if (t === 'THANH_TOAN') return <span className="badge badge-green">THANH_TOAN</span>;
    return <span className="badge badge-amber">{tbl}</span>;
  };

  return (
    <div className="glass-panel" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={20} color="#f59e0b" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Oracle Audit Trail (Bảng NHAT_KY)
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Minh chứng CĐR L2: Tự động ghi nhận bởi PL/SQL Package & Trigger vào Tablespace <code style={{ color: '#fbbf24' }}>TS_LOG</code>
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={isPolling}
              onChange={(e) => setIsPolling(e.target.checked)}
              style={{ accentColor: '#0284c7' }}
            />
            Auto Live Polling (2.5s)
          </label>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            <RefreshCw size={13} className={isLoading ? 'pulse-active' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Filter size={12} /> Lọc Action:
        </span>
        {['ALL', 'INSERT', 'UPDATE', 'RESET'].map((act) => (
          <button
            key={act}
            onClick={() => setFilterAction(act)}
            className={`btn ${filterAction === act ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: 999 }}
          >
            {act}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Tổng cộng: <b>{filteredLogs.length}</b> bản ghi
        </span>
      </div>

      {/* Log Table Container */}
      <div
        style={{
          maxHeight: 420,
          overflowY: 'auto',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(9, 12, 21, 0.6)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 12px', width: 60 }}>ID</th>
              <th style={{ padding: '10px 12px', width: 120 }}>Bảng tác động</th>
              <th style={{ padding: '10px 12px', width: 90 }}>Hành động</th>
              <th style={{ padding: '10px 12px', width: 150 }}><Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Thời gian</th>
              <th style={{ padding: '10px 12px', width: 100 }}><User size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />User</th>
              <th style={{ padding: '10px 12px' }}><FileText size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Nội dung kiểm toán chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)' }}>
                  Chưa có bản ghi nhật ký nào. Hãy thực hiện đặt vé hoặc chạy Test Lab để quan sát trigger/package ghi log!
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.malog}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 12px', color: 'var(--text-dim)', fontWeight: 600 }}>#{log.malog}</td>
                  <td style={{ padding: '10px 12px' }}>{getTableBadge(log.bangtacdong)}</td>
                  <td style={{ padding: '10px 12px' }}>{getActionBadge(log.hanhdong)}</td>
                  <td style={{ padding: '10px 12px', color: '#93c5fd', fontFamily: 'monospace' }}>{log.thoigian}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{log.nguoithuchien}</td>
                  <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 500 }}>{log.noidung}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
