import React, { useState } from 'react';
import type { Seat, ConcurrencyTestResponse, ReleaseSeatResponse } from '../types';
import { api } from '../api/client';
import { Zap, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface TestLabPageProps {
  seats: Seat[];
  onRefreshData: () => void;
}

export const TestLabPage: React.FC<TestLabPageProps> = ({ seats, onRefreshData }) => {
  const [activeLabTab, setActiveLabTab] = useState<'concurrency' | 'release_seat'>('concurrency');
  const availableSeats = seats.filter((s) => s.tinhtrang === 'Trong');
  const [selectedSeatId, setSelectedSeatId] = useState<number>(
    availableSeats.length > 0 ? availableSeats[0].maghe : 1
  );

  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<ConcurrencyTestResponse | null>(null);
  const [releaseResult, setReleaseResult] = useState<ReleaseSeatResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const targetSeat = seats.find((s) => s.maghe === selectedSeatId) || seats[0];

  // 1. Chạy bài Test 1: Tranh chấp 2 luồng đồng thời
  const handleRunConcurrencyTest = async () => {
    if (!targetSeat) return;
    setIsRunning(true);
    setErrorMsg(null);
    setTestResult(null);

    try {
      const res = await api.runConcurrencyTest({
        ma_suat: targetSeat.masuat,
        ma_ghe: targetSeat.maghe,
      });
      setTestResult(res);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Lỗi khi thực nghiệm');
    } finally {
      setIsRunning(false);
    }
  };

  // 2. Chạy bài Test 2: Thử nghiệm nhả ghế với UQ_VE_GHE_HIEU_LUC (Giai đoạn 12)
  const handleRunReleaseTest = async () => {
    if (!targetSeat) return;
    setIsRunning(true);
    setErrorMsg(null);
    setReleaseResult(null);

    try {
      const res = await api.runReleaseSeatTest({
        ma_suat: targetSeat.masuat,
        ma_ghe: targetSeat.maghe,
      });
      setReleaseResult(res);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Lỗi khi thực nghiệm nhả ghế');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: 24,
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              }}
            >
              <Zap size={24} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Test Lab: Thực Nghiệm Khóa, Tranh Chấp & Nhả Ghế Tự Động
              </h2>
              <small style={{ color: '#c084fc', fontSize: '0.78rem' }}>
                Minh chứng Chuẩn đầu ra L1/L2 đề tài Thạc sĩ Quản trị CSDL Nâng cao (Oracle 26ai Free)
              </small>
            </div>
          </div>

          {/* Subtabs Switcher */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                setActiveLabTab('concurrency');
                setTestResult(null);
                setReleaseResult(null);
              }}
              className={`btn ${activeLabTab === 'concurrency' ? 'btn-accent' : 'btn-outline'}`}
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
              Bài Test 1: Concurrency (2 Luồng Song Song)
            </button>
            <button
              onClick={() => {
                setActiveLabTab('release_seat');
                setTestResult(null);
                setReleaseResult(null);
              }}
              className={`btn ${activeLabTab === 'release_seat' ? 'btn-accent' : 'btn-outline'}`}
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
              Bài Test 2: Nhả Ghế (UQ_VE_GHE_HIEU_LUC)
            </button>
          </div>
        </div>
      </div>

      {/* Main Execution Card */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14, color: '#f8fafc' }}>
          Bước 1: Chọn Ghế Thử Nghiệm Trên Sơ Đồ
        </h3>

        {/* Quick Seat Selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 120, overflowY: 'auto', padding: 4 }}>
            {seats.map((s) => {
              const isAvailable = s.tinhtrang === 'Trong';
              const isSelected = selectedSeatId === s.maghe;

              return (
                <button
                  key={s.maghe}
                  disabled={!isAvailable}
                  onClick={() => setSelectedSeatId(s.maghe)}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    opacity: isAvailable ? 1 : 0.4,
                    borderColor: isSelected ? '#38bdf8' : isAvailable ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                  }}
                >
                  {s.hangghe}{s.soghe} ({s.tinhtrang})
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        {targetSeat && (
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Ghế đang chọn:</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
                Ghế {targetSeat.hangghe}{targetSeat.soghe} ({targetSeat.loaighe}) • {targetSeat.giavedukien.toLocaleString()} đ
              </div>
            </div>

            {activeLabTab === 'concurrency' ? (
              <button
                onClick={handleRunConcurrencyTest}
                disabled={isRunning || targetSeat.tinhtrang !== 'Trong'}
                className="btn btn-accent"
                style={{ padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700 }}
              >
                <Zap size={18} className={isRunning ? 'pulse-active' : ''} />
                {isRunning ? 'Đang kích hoạt 2 luồng song song...' : '🚀 Kích Hoạt 2 Luồng Tranh Chấp (Test 1)'}
              </button>
            ) : (
              <button
                onClick={handleRunReleaseTest}
                disabled={isRunning || targetSeat.tinhtrang !== 'Trong'}
                className="btn btn-accent"
                style={{ padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700 }}
              >
                <RefreshCw size={18} className={isRunning ? 'pulse-active' : ''} />
                {isRunning ? 'Đang chạy kịch bản 4 bước...' : '🔄 Kích Hoạt Kịch Bản Nhả Ghế (Test 2)'}
              </button>
            )}
          </div>
        )}

        {targetSeat && targetSeat.tinhtrang !== 'Trong' && (
          <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#f59e0b' }}>
            ⚠️ Ghế {targetSeat.hangghe}{targetSeat.soghe} hiện không ở trạng thái 'Trong'. Vui lòng chọn ghế trống khác hoặc bấm "Giải Phóng Ghế" trên thanh điều hướng.
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div style={{ padding: 14, borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      {/* =========================================================================
          KẾT QUẢ BÀI TEST 1: CONCURRENCY RACE CONDITION
      ========================================================================= */}
      {activeLabTab === 'concurrency' && testResult && (
        <div className="glass-panel" style={{ padding: 24, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Kết Quả Thực Nghiệm Từ Oracle Server
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#38bdf8', margin: '4px 0 0 0' }}>
                {testResult.summary}
              </p>
            </div>
            <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
              Index UQ_VE_GHE_HIEU_LUC Validated
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
            {testResult.results.map((res, idx) => {
              const isSuccess = res.status_code === 200;
              return (
                <div
                  key={idx}
                  style={{
                    padding: 20,
                    borderRadius: 'var(--radius-md)',
                    background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isSuccess ? <CheckCircle2 size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                      <b style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{res.session}</b>
                    </div>
                    <span className={`badge ${isSuccess ? 'badge-green' : 'badge-red'}`}>
                      HTTP {res.status_code}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Thời gian thực thi:</span>
                      <b style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{res.duration_ms} ms</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Trạng thái xử lý:</span>
                      <b style={{ color: isSuccess ? '#34d399' : '#f87171' }}>{res.result}</b>
                    </div>
                    {isSuccess && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Mã đơn phát sinh:</span>
                        <b>#{res.ma_don}</b>
                      </div>
                    )}
                    <div style={{ marginTop: 8, padding: 10, borderRadius: 6, background: 'rgba(0,0,0,0.3)', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>Phản hồi từ Stored Procedure:</span>
                      <span style={{ color: isSuccess ? '#a7f3d0' : '#fca5a5' }}>{res.message}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.82rem', lineHeight: 1.6 }}>
            <b style={{ color: '#38bdf8', display: 'block', marginBottom: 6 }}>
              🎓 Kết Luận Khoa Học Báo Cáo Tiểu Luận:
            </b>
            <p style={{ margin: 0, color: '#e2e8f0' }}>
              Khi 2 giao dịch đồng thời gửi lệnh đặt cùng ghế, Oracle kích hoạt cơ chế Row Exclusive Lock
              và Index <code>UQ_VE_GHE_HIEU_LUC</code>. Phiên chậm hơn ngay lập tức bị ngắt với ngoại lệ{' '}
              <code>DUP_VAL_ON_INDEX (ORA-00001)</code>. Nhờ đó, thủ tục <code>PKG_DATVE.DAT_VE_GIU_CHO</code>{' '}
              chủ động ROLLBACK và trả về HTTP 409, <b>triệt tiêu 100% rủi ro Overbooking (Bán trùng vé)</b>.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          KẾT QUẢ BÀI TEST 2: THỰC NGHIỆM NHẢ GHẾ TỰ ĐỘNG (GIAI ĐOẠN 12)
      ========================================================================= */}
      {activeLabTab === 'release_seat' && releaseResult && (
        <div className="glass-panel" style={{ padding: 24, border: '1px solid rgba(245, 158, 11, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                {releaseResult.test_name}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#fbbf24', margin: '4px 0 0 0' }}>
                {releaseResult.summary}
              </p>
            </div>
            <span className="badge badge-amber">Function-Based Index Verified</span>
          </div>

          {/* 4 Steps timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {releaseResult.steps.map((st) => (
              <div
                key={st.step}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: st.status_code === 200 ? '#10b981' : st.status_code === 409 ? '#ef4444' : '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0,
                    fontSize: '0.85rem',
                  }}
                >
                  {st.step}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{st.title}</b>
                    <span className={`badge ${st.status_code === 200 ? 'badge-green' : 'badge-red'}`}>
                      HTTP {st.status_code}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Phản hồi Oracle: <b>{st.message}</b>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: 2 }}>
                    {st.result}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sửa Lỗi 1 Highlight */}
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.82rem', lineHeight: 1.6 }}>
            <b style={{ color: '#34d399', display: 'block', marginBottom: 6 }}>
              💡 Điểm Cốt Lõi Khắc Phục Lỗi 1 (Theo Đề Cương Thạc Sĩ):
            </b>
            <p style={{ margin: 0, color: '#e2e8f0' }}>
              Ở DDL cũ, ràng buộc <code>UNIQUE (MaSuat, MaGhe)</code> tính cả các dòng đã Hủy,
              khiến ghế bị "treo vĩnh viễn" và không ai đặt lại được. Bằng cách thay thế bằng Function-Based Unique Index:{' '}
              <code>UQ_VE_GHE_HIEU_LUC ON VE (CASE WHEN TrangThai &lt;&gt; 'Huy' THEN MaSuat END, CASE WHEN TrangThai &lt;&gt; 'Huy' THEN MaGhe END)</code>,
              khi khách hủy vé, giá trị index chuyển thành <code>NULL</code>, Oracle tự động giải phóng ghế ngay lập tức!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
