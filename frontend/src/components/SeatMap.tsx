import React from 'react';
import type { Seat } from '../types';
import { CheckCircle2, Clock, Lock } from 'lucide-react';

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: Seat[];
  onToggleSeat: (seat: Seat) => void;
  isLoading: boolean;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeats,
  onToggleSeat,
  isLoading,
}) => {
  // Nhóm ghế theo từng hàng chữ cái (HangGhe: A, B, ...)
  const rows = React.useMemo(() => {
    const grouped: { [key: string]: Seat[] } = {};
    seats.forEach((seat) => {
      if (!grouped[seat.hangghe]) {
        grouped[seat.hangghe] = [];
      }
      grouped[seat.hangghe].push(seat);
    });
    Object.keys(grouped).forEach((row) => {
      grouped[row].sort((a, b) => a.soghe - b.soghe);
    });
    return grouped;
  }, [seats]);

  // Thống kê số lượng ghế
  const stats = React.useMemo(() => {
    return {
      total: seats.length,
      available: seats.filter((s) => s.tinhtrang === 'Trong').length,
      holding: seats.filter((s) => s.tinhtrang === 'DangGiuCho').length,
      booked: seats.filter((s) => s.tinhtrang === 'DaDat').length,
    };
  }, [seats]);

  const selectedSeatIds = new Set(selectedSeats.map((s) => s.maghe));

  return (
    <div className="glass-panel" style={{ padding: 24, position: 'relative' }}>
      {/* Header & Thống kê */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Sơ Đồ Ghế Phòng Chiếu (IMAX Laser)
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Dữ liệu đồng bộ tức thì từ Oracle View <code style={{ color: '#38bdf8' }}>V_GHE_TRONG</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge badge-green">
            <CheckCircle2 size={12} /> {stats.available} Trống
          </span>
          <span className="badge badge-amber">
            <Clock size={12} /> {stats.holding} Đang Giữ Chỗ (10p)
          </span>
          <span className="badge badge-red">
            <Lock size={12} /> {stats.booked} Đã Bán
          </span>
        </div>
      </div>

      {/* Curved Cinema Screen */}
      <div className="cinema-screen-container">
        <div className="cinema-screen-curve" />
        <div className="cinema-screen-text">MÀN HÌNH CHIẾU CHÍNH (IMAX LASER)</div>
      </div>

      {/* Seat Rows Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '20px 0', alignItems: 'center' }}>
        {Object.keys(rows).length === 0 ? (
          <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>
            {isLoading ? 'Đang đọc dữ liệu từ Oracle Database...' : 'Chưa có dữ liệu ghế cho suất chiếu này.'}
          </div>
        ) : (
          Object.keys(rows).map((rowLetter) => (
            <div key={rowLetter} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Row letter label left */}
              <div
                style={{
                  width: 24,
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: 'var(--text-dim)',
                  textAlign: 'center',
                }}
              >
                {rowLetter}
              </div>

              {/* Seats in this row */}
              <div style={{ display: 'flex', gap: 8 }}>
                {rows[rowLetter].map((seat) => {
                  const isSelected = selectedSeatIds.has(seat.maghe);
                  const isAvailable = seat.tinhtrang === 'Trong';
                  const isVip = seat.loaighe === 'VIP';

                  return (
                    <button
                      key={seat.maghe}
                      disabled={!isAvailable}
                      onClick={() => onToggleSeat(seat)}
                      className={`seat-button status-${seat.tinhtrang} ${isSelected ? 'status-selected' : ''} ${isVip ? 'seat-type-vip' : ''}`}
                      style={{
                        width: 44,
                        height: 44,
                        position: 'relative',
                      }}
                      title={`Ghế ${seat.hangghe}${seat.soghe} (${seat.loaighe}) - ${seat.giavedukien.toLocaleString()} đ - ${seat.tinhtrang === 'Trong' ? 'Bấm để chọn' : seat.tinhtrang}`}
                    >
                      <span>{seat.hangghe}{seat.soghe}</span>
                      {isVip && (
                        <span
                          style={{
                            fontSize: '0.55rem',
                            position: 'absolute',
                            bottom: 2,
                            fontWeight: 700,
                            color: '#fbbf24',
                            letterSpacing: '0.02em',
                          }}
                        >
                          VIP
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row letter label right */}
              <div
                style={{
                  width: 24,
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: 'var(--text-dim)',
                  textAlign: 'center',
                }}
              >
                {rowLetter}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legend & Chú thích */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 18,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.78rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: 'rgba(16, 185, 129, 0.25)', border: '1px solid #10b981' }} />
          <span>Ghế Trống (Chọn được)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: '#0284c7', border: '1px solid #38bdf8' }} />
          <span>Đang Chọn ({selectedSeats.length})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: 'rgba(245, 158, 11, 0.25)', border: '1px solid #f59e0b' }} />
          <span>Đang Giữ Chỗ (10 Phút)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: 'rgba(239, 68, 68, 0.25)', border: '1px solid #ef4444' }} />
          <span>Đã Bán</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: 'transparent', borderBottom: '2px solid #f59e0b', borderLeft: '1px solid #475569', borderRight: '1px solid #475569', borderTop: '1px solid #475569' }} />
          <span>Ghế VIP (+20% Giá)</span>
        </div>
      </div>
    </div>
  );
};
