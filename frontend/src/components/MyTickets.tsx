import React, { useState } from 'react';
import type { OrderItem, AppUser } from '../types';
import { api } from '../api/client';
import { Ticket, CreditCard, XCircle, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface MyTicketsProps {
  orders: OrderItem[];
  currentUser: AppUser;
  onRefresh: () => void;
  isLoading: boolean;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ orders, currentUser, onRefresh, isLoading }) => {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Lọc chỉ hiển thị đơn của khách hàng này nếu có makh
  const myOrders = currentUser?.makh
    ? orders.filter((o) => o.makh === currentUser.makh || (o.tenkhachhang && currentUser.hoten && o.tenkhachhang.toLowerCase().includes(currentUser.hoten.toLowerCase())))
    : orders;

  const handlePay = async (order: OrderItem) => {
    setProcessingId(order.madon);
    setMsg(null);
    try {
      const res = await api.confirmPayment({
        ma_don: order.madon,
        phuong_thuc: 'The',
        so_tien: order.tongtien,
      });
      setMsg({ type: 'success', text: `Oracle: ${res.message} (Đơn #${order.madon})` });
      onRefresh();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.detail || e.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (order: OrderItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn vé #${order.madon}? Ghế sẽ được nhả lại ngay lập tức.`)) return;
    setProcessingId(order.madon);
    setMsg(null);
    try {
      const res = await api.cancelBooking({ ma_don: order.madon });
      setMsg({ type: 'success', text: `Oracle: ${res.message}. Ghế đã được giải phóng thành công!` });
      onRefresh();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.detail || e.message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ticket size={22} color="#38bdf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Vé Của Tôi ({currentUser.hoten})
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Tra cứu các vé đã đặt, thực hiện thanh toán giữ chỗ hoặc hủy vé để nhả ghế
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="btn btn-outline"
          style={{ padding: '6px 14px', fontSize: '0.75rem' }}
        >
          <RefreshCw size={14} className={isLoading ? 'pulse-active' : ''} />
          Làm mới
        </button>
      </div>

      {msg && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${msg.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: msg.type === 'success' ? '#a7f3d0' : '#fca5a5',
          }}
        >
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      {myOrders.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.5 }}>🎟️</div>
          Bạn chưa có đơn đặt vé nào. Hãy chọn phim và ghế ngồi để trải nghiệm!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {myOrders.map((o) => {
            const isHolding = o.trangthai === 'Giu cho';
            const isPaid = o.trangthai === 'Da TT';
            const isCanceled = o.trangthai === 'Huy';

            return (
              <div
                key={o.madon}
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: isPaid ? 'rgba(16, 185, 129, 0.08)' : isHolding ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.3)' : isHolding ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ color: '#38bdf8', fontSize: '1rem' }}>Đơn Đặt #{o.madon}</b>
                  {isPaid && <span className="badge badge-green"><CheckCircle size={12} /> ĐÃ XUẤT VÉ</span>}
                  {isHolding && <span className="badge badge-amber"><Clock size={12} /> ĐANG GIỮ CHỖ</span>}
                  {isCanceled && <span className="badge badge-red"><XCircle size={12} /> ĐÃ HỦY</span>}
                </div>

                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Phim: <b style={{ color: '#f8fafc' }}>{o.tenphim || 'Phim Chiếu Rạp'}</b></div>
                  <div>Rạp: {o.tenrap || 'Cinema Star Cầu Giấy'} • {o.tenphong || 'Phòng 01'}</div>
                  <div>
                    Ghế đã chọn:{' '}
                    <b style={{ color: '#fbbf24' }}>
                      {o.danhsachghe || (o.hangghe && o.soghe ? `${o.hangghe}${o.soghe}` : 'Ghế đã xác nhận')}
                    </b>
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>Ngày đặt: {o.ngaydat}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', marginTop: 4 }}>
                    Tổng tiền: {Number(o.tongtien).toLocaleString()} VNĐ
                  </div>
                </div>

                {isHolding && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => handlePay(o)}
                      disabled={processingId === o.madon}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: '0.76rem' }}
                    >
                      <CreditCard size={14} /> Thanh Toán Ngay
                    </button>
                    <button
                      onClick={() => handleCancel(o)}
                      disabled={processingId === o.madon}
                      className="btn btn-danger"
                      style={{ padding: '8px 12px', fontSize: '0.76rem' }}
                      title="Hủy vé và nhả ghế lại cho người khác"
                    >
                      <XCircle size={14} /> Hủy Vé
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
