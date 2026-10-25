import React, { useEffect, useState } from 'react';
import type { Showtime } from '../types';
import { api } from '../api/client';
import { BarChart3, RefreshCw, Film, Percent } from 'lucide-react';

interface OccupancyReportProps {
  showtimes: Showtime[];
}

export const OccupancyReport: React.FC<OccupancyReportProps> = ({ showtimes }) => {
  const [rates, setRates] = useState<{ [showtimeId: number]: number }>({});
  const [loading, setLoading] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    const newRates: { [id: number]: number } = {};
    for (const st of showtimes) {
      try {
        const res = await api.getOccupancyRate(st.masuat);
        newRates[st.masuat] = res.occupancy_rate;
      } catch (e) {
        newRates[st.masuat] = 0;
      }
    }
    setRates(newRates);
    setLoading(false);
  };

  useEffect(() => {
    if (showtimes.length > 0) {
      fetchRates();
    }
  }, [showtimes]);

  return (
    <div className="glass-panel" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={20} color="#a855f7" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Báo Cáo Tỷ Lệ Lấp Đầy Phòng Chiếu (Gói PL/SQL PKG_BAOCAO)
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Kết quả tính toán trực tiếp từ Function <code>PKG_BAOCAO.TINH_TY_LE_LAP_DAY(p_ma_suat)</code> trong Oracle
          </p>
        </div>

        <button
          onClick={fetchRates}
          disabled={loading}
          className="btn btn-outline"
          style={{ padding: '6px 14px', fontSize: '0.75rem' }}
        >
          <RefreshCw size={14} className={loading ? 'pulse-active' : ''} />
          Tính lại tỷ lệ
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {showtimes.map((st) => {
          const rate = rates[st.masuat] !== undefined ? rates[st.masuat] : 0;
          return (
            <div
              key={st.masuat}
              style={{
                padding: 18,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Film size={16} color="#38bdf8" />
                    <b style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{st.tenphim}</b>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {st.tenrap} • {st.tenphong} ({st.soghe} ghế)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: 2 }}>
                    Suất chiếu #{st.masuat}: {st.giobatdau}
                  </div>
                </div>

                <span className={`badge ${rate >= 70 ? 'badge-green' : rate >= 30 ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                  <Percent size={12} /> {rate}%
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                  <span>Tỷ lệ ghế đã bán / giữ chỗ</span>
                  <span>{rate}% / 100%</span>
                </div>
                <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${rate}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: rate >= 70 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
