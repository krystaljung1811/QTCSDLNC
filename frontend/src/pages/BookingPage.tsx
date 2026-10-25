import React, { useState, useEffect } from 'react';
import type { Seat, Showtime, Movie, Customer, Concession, AppUser } from '../types';
import { SeatMap } from '../components/SeatMap';
import { api } from '../api/client';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Ticket,
  Film,
  Calendar,
  Coffee,
  Plus,
  Minus
} from 'lucide-react';

interface BookingPageProps {
  seats: Seat[];
  selectedSeats: Seat[];
  onToggleSeat: (seat: Seat) => void;
  onClearSelectedSeats: () => void;
  onRefreshData: () => void;
  showtimes: Showtime[];
  movies: Movie[];
  customers: Customer[];
  concessions: Concession[];
  currentShowtimeId: number;
  onSelectShowtime: (showtimeId: number) => void;
  currentUser: AppUser;
  isLoading: boolean;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  seats,
  selectedSeats,
  onToggleSeat,
  onClearSelectedSeats,
  onRefreshData,
  showtimes,
  movies,
  customers,
  concessions,
  currentShowtimeId,
  onSelectShowtime,
  currentUser,
  isLoading,
}) => {
  // Chọn phim & suất chiếu
  const [selectedMovieId, setSelectedMovieId] = useState<number>(
    movies.length > 0 ? movies[0].maphim : 1
  );

  // Chọn khách hàng (nếu là thu ngân có thể chọn khách, nếu là khách thì mặc định khách đó)
  const defaultCustomerId = currentUser?.makh || (customers.length > 0 ? customers[0].makh : 1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(defaultCustomerId);

  useEffect(() => {
    if (currentUser?.makh) {
      setSelectedCustomerId(currentUser.makh);
    } else if (customers.length > 0) {
      setSelectedCustomerId(customers[0].makh);
    }
  }, [currentUser, customers]);

  // Giỏ hàng bắp nước
  const [concessionCart, setConcessionCart] = useState<{ [madv: number]: number }>({});

  // Đơn hàng đang trong trạng thái Giữ chỗ
  const [activeOrder, setActiveOrder] = useState<{
    ma_don: number;
    ma_ve_list: number[];
    seat_names: string;
    ticket_price: number;
    total_price: number;
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'The' | 'Tien mat' | 'Vi dien tu'>('The');
  const [isReserving, setIsReserving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredShowtimes = showtimes.filter((st) => st.maphim === selectedMovieId);
  const selectedCustomer = customers.find((c) => c.makh === selectedCustomerId) || customers[0];

  // Ưu tiên hiển thị các phim đang có suất chiếu chiếu trước, kèm top phim tiêu biểu
  const activeMovieIds = new Set(showtimes.map((s) => s.maphim));
  const displayMovies = [
    ...movies.filter((m) => activeMovieIds.has(m.maphim)),
    ...movies.filter((m) => !activeMovieIds.has(m.maphim)).slice(0, 10),
  ];

  // Tiền bắp nước
  const concessionTotal = Object.entries(concessionCart).reduce((sum, [madv, qty]) => {
    const item = concessions.find((c) => c.madv === Number(madv));
    return sum + (item ? item.dongia * qty : 0);
  }, 0);

  // Tổng tiền vé tạm tính
  const ticketBaseTotal = selectedSeats.reduce((sum, s) => sum + s.giavedukien, 0);
  const totalCalculated = ticketBaseTotal + concessionTotal;

  const handleQuantityChange = (madv: number, delta: number) => {
    setConcessionCart((prev) => {
      const current = prev[madv] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[madv];
        return copy;
      }
      return { ...prev, [madv]: next };
    });
  };

  // 1. Thực hiện Đặt giữ chỗ cho 1 hoặc nhiều ghế
  const handleReserve = async () => {
    if (selectedSeats.length === 0) return;
    setIsReserving(true);
    setFeedback(null);

    const seatIds = selectedSeats.map((s) => s.maghe);
    const seatNames = selectedSeats.map((s) => `${s.hangghe}${s.soghe}`).join(', ');

    try {
      const res = await api.reserveSeats({
        ma_kh: selectedCustomerId,
        ma_nv: currentUser.vaitro === 'THU_NGAN' ? currentUser.manv : null,
        ma_suat: currentShowtimeId,
        ma_ghe_list: seatIds,
      });

      setFeedback({
        type: 'success',
        message: `Oracle phản hồi: ${res.message}. Mã đơn: #${res.ma_don}`,
      });

      setActiveOrder({
        ma_don: res.ma_don,
        ma_ve_list: res.ma_ve_list,
        seat_names: seatNames,
        ticket_price: res.tong_tien,
        total_price: res.tong_tien + concessionTotal,
      });

      onClearSelectedSeats();
      onRefreshData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Lỗi kết nối CSDL';
      setFeedback({
        type: 'error',
        message: `Oracle chặn giao dịch: ${errorMsg}`,
      });
      onRefreshData();
    } finally {
      setIsReserving(false);
    }
  };

  // 2. Xác nhận thanh toán
  const handleConfirmPayment = async () => {
    if (!activeOrder) return;
    setIsPaying(true);
    setFeedback(null);

    try {
      const res = await api.confirmPayment({
        ma_don: activeOrder.ma_don,
        phuong_thuc: paymentMethod,
        so_tien: activeOrder.total_price,
      });

      setFeedback({
        type: 'success',
        message: `Oracle phản hồi: ${res.message}. Đơn #${activeOrder.ma_don} thanh toán thành công! Vé đã được xuất.`,
      });

      setActiveOrder(null);
      setConcessionCart({});
      onRefreshData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Lỗi thanh toán';
      setFeedback({
        type: 'error',
        message: `Lỗi từ CSDL: ${errorMsg}`,
      });
      onRefreshData();
    } finally {
      setIsPaying(false);
    }
  };

  // 3. Hủy vé giữ chỗ
  const handleCancelOrder = async () => {
    if (!activeOrder) return;
    setIsCanceling(true);
    setFeedback(null);

    try {
      const res = await api.cancelBooking({
        ma_don: activeOrder.ma_don,
      });

      setFeedback({
        type: 'success',
        message: `Oracle phản hồi: ${res.message}. Ghế [${activeOrder.seat_names}] đã được nhả lại thành Trống nhờ Index UQ_VE_GHE_HIEU_LUC!`,
      });

      setActiveOrder(null);
      onRefreshData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Lỗi hủy vé';
      setFeedback({
        type: 'error',
        message: `Lỗi từ CSDL: ${errorMsg}`,
      });
      onRefreshData();
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* =========================================================================
          BƯỚC 1: THANH CHỌN PHIM VÀ SUẤT CHIẾU TRỰC TIẾP TỪ CSDL
      ========================================================================= */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Film size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              {currentUser.vaitro === 'THU_NGAN' ? 'Quầy Vé POS - Chọn Phim & Suất Chiếu' : 'Bước 1: Chọn Phim & Suất Chiếu'}
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Dữ liệu đọc trực tiếp từ CSDL Oracle
          </span>
        </div>

        {/* Danh sách phim */}
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
          {displayMovies.map((m) => {
            const isSelected = selectedMovieId === m.maphim;
            return (
              <div
                key={m.maphim}
                onClick={() => {
                  setSelectedMovieId(m.maphim);
                  const sts = showtimes.filter((s) => s.maphim === m.maphim);
                  if (sts.length > 0) onSelectShowtime(sts[0].masuat);
                }}
                style={{
                  minWidth: 220,
                  cursor: 'pointer',
                  borderRadius: 10,
                  padding: 10,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1.5px solid ${isSelected ? '#38bdf8' : 'var(--border-subtle)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <img
                  src={m.posterurl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1'}
                  alt={m.tenphim}
                  style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 6 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#38bdf8' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.tenphim}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {m.theloai} • {m.thoiluong}p
                  </div>
                  <span className="badge badge-amber" style={{ fontSize: '0.62rem', marginTop: 4 }}>
                    {m.dotuoi}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Danh sách suất chiếu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="#f59e0b" /> Chọn giờ chiếu:
          </span>
          {filteredShowtimes.length === 0 ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Chưa có suất chiếu nào cho phim này trong CSDL.
            </span>
          ) : (
            filteredShowtimes.map((st) => {
              const isSelected = currentShowtimeId === st.masuat;
              return (
                <button
                  key={st.masuat}
                  onClick={() => onSelectShowtime(st.masuat)}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '8px 14px', fontSize: '0.78rem' }}
                >
                  <b>{st.giobatdau.split(' ')[1] || st.giobatdau}</b>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({st.tenphong || 'Phòng 01'})</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          BƯỚC 2 & 3: SƠ ĐỒ GHẾ & BẢNG ĐIỀU PHỐI GIAO DỊCH
      ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* CỘT TRÁI: SƠ ĐỒ GHẾ V_GHE_TRONG (CHỌN NHIỀU GHẾ) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SeatMap
            seats={seats}
            selectedSeats={selectedSeats}
            onToggleSeat={(seat) => {
              onToggleSeat(seat);
              setFeedback(null);
            }}
            isLoading={isLoading}
          />
        </div>

        {/* CỘT PHẢI: BẢNG TÍNH TOÁN & GỌI PROCEDURE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Feedback Thông Báo */}
          {feedback && (
            <div
              style={{
                padding: 14,
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
                color: feedback.type === 'success' ? '#a7f3d0' : '#fca5a5',
              }}
            >
              {feedback.type === 'success' ? (
                <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 2, color: '#10b981' }} />
              ) : (
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: '#ef4444' }} />
              )}
              <div>
                <b style={{ display: 'block', marginBottom: 2 }}>
                  {feedback.type === 'success' ? 'Oracle Phản Hồi Thành Công' : 'Oracle Chặn Giao Dịch'}
                </b>
                <span>{feedback.message}</span>
              </div>
            </div>
          )}

          {/* Khối Thông Tin Đặt Vé */}
          <div className="glass-panel" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ticket size={20} color="#0284c7" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  Thông Tin Đơn Vé ({selectedSeats.length} Ghế)
                </h3>
              </div>
              {selectedSeats.length > 0 && (
                <button
                  type="button"
                  onClick={onClearSelectedSeats}
                  style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.74rem', cursor: 'pointer' }}
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>

            {/* Chọn khách hàng (nếu là thu ngân có thể đổi khách hàng) */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Khách hàng giao dịch:
              </label>
              {currentUser.vaitro === 'KHACH' ? (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span><b>{selectedCustomer?.hoten}</b> ({selectedCustomer?.sdt})</span>
                  <span className="badge badge-green">{selectedCustomer?.diemtichluy || 0} điểm</span>
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid var(--border-subtle)',
                    color: '#f8fafc',
                    fontSize: '0.82rem',
                  }}
                >
                  {customers.map((c) => (
                    <option key={c.makh} value={c.makh}>
                      {c.hoten} - SĐT: {c.sdt} (Tích lũy: {c.diemtichluy}đ)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Ghế đã chọn */}
            {selectedSeats.length > 0 ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(2, 132, 199, 0.1)',
                  border: '1px solid rgba(2, 132, 199, 0.3)',
                  marginBottom: 16,
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Các ghế đã chọn:</span>
                  <b style={{ color: '#38bdf8', fontSize: '1rem' }}>
                    {selectedSeats.map((s) => `${s.hangghe}${s.soghe}`).join(', ')}
                  </b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tiền vé tính chuẩn từ CSDL:</span>
                  <b style={{ color: '#10b981' }}>{ticketBaseTotal.toLocaleString()} VNĐ</b>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 14,
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border-subtle)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  marginBottom: 16,
                }}
              >
                Nhấp chọn các ghế màu xanh trên sơ đồ (có thể chọn nhiều ghế).
              </div>
            )}

            {/* Chọn bắp nước */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Coffee size={16} color="#fbbf24" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                  Bắp Nước & Combo (Bảng DICH_VU):
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {concessions.map((c) => {
                  const qty = concessionCart[c.madv] || 0;
                  return (
                    <div
                      key={c.madv}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div>
                        <div><b>{c.tendv}</b></div>
                        <small style={{ color: '#fbbf24' }}>{c.dongia.toLocaleString()} đ</small>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(c.madv, -1)}
                          disabled={qty === 0}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            border: '1px solid var(--border-subtle)',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            cursor: qty === 0 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(c.madv, 1)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            border: '1px solid var(--border-subtle)',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tổng cộng & Nút giữ chỗ */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
                <b style={{ fontSize: '1.25rem', color: '#34d399' }}>{totalCalculated.toLocaleString()} VNĐ</b>
              </div>

              <button
                onClick={handleReserve}
                disabled={selectedSeats.length === 0 || isReserving}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
              >
                <ShieldCheck size={16} />
                {isReserving ? 'Đang thực thi Stored Procedure...' : `Thực Thi Đặt Giữ Chỗ (${selectedSeats.length} Ghế)`}
              </button>
            </div>
          </div>

          {/* Đơn hàng đang trong trạng thái Giữ chỗ */}
          {activeOrder && (
            <div
              className="glass-panel"
              style={{
                padding: 20,
                border: '1.5px solid rgba(245, 158, 11, 0.5)',
                background: 'rgba(30, 27, 75, 0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} color="#f59e0b" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                    Đơn Đang Giữ Chỗ #{activeOrder.ma_don}
                  </h4>
                </div>
                <span className="badge badge-amber">10:00 Phút</span>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: 14 }}>
                <div>Khách hàng: <b>{selectedCustomer?.hoten}</b></div>
                <div>Ghế: <b style={{ color: '#38bdf8' }}>{activeOrder.seat_names}</b> ({activeOrder.ma_ve_list.length} vé)</div>
                <div>Tổng tiền: <b style={{ color: '#34d399', fontSize: '0.95rem' }}>{activeOrder.total_price.toLocaleString()} VNĐ</b></div>
              </div>

              {/* Chọn phương thức thanh toán */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Phương thức thanh toán:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {(['The', 'Tien mat', 'Vi dien tu'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`btn ${paymentMethod === method ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '6px 4px', fontSize: '0.72rem' }}
                    >
                      {method === 'The' ? 'Thẻ' : method === 'Tien mat' ? 'Tiền mặt' : 'Ví điện tử'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút xác nhận thanh toán & Hủy vé */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isPaying}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  <CreditCard size={14} />
                  {isPaying ? 'Đang xác nhận...' : 'Xác Nhận Thanh Toán'}
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isCanceling}
                  className="btn btn-danger"
                  style={{ padding: '10px 14px' }}
                  title="Gọi PKG_DATVE.HUY_VE để giải phóng ghế"
                >
                  <XCircle size={14} />
                  {isCanceling ? 'Đang hủy...' : 'Hủy Vé'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
