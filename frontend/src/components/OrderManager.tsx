import React, { useState } from 'react';
import type { OrderItem } from '../types';
import { api } from '../api/client';
import { Ticket, CreditCard, XCircle, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface OrderManagerProps {
  orders: OrderItem[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const OrderManager: React.FC<OrderManagerProps> = ({ orders, onRefresh, isLoading }) => {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn #${order.madon} trong Oracle Database?`)) return;
    setProcessingId(order.madon);
    setMsg(null);
    try {
      const res = await api.cancelBooking({ ma_don: order.madon });
      setMsg({ type: 'success', text: `Oracle: ${res.message} (Đã giải phóng ghế)` });
      onRefresh();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.detail || e.message });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Da TT') return <span className="badge badge-green">ĐÃ THANH TOÁN</span>;
    if (status === 'Giu cho') return <span className="badge badge-amber">ĐANG GIỮ CHỖ</span>;
    if (status === 'Huy') return <span className="badge badge-red">ĐÃ HỦY</span>;
    return <span className="badge badge-blue">{status}</span>;
  };

  return (
    <div className="glass-panel" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ticket size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Quản Lý Đơn Vé Thực Tế (Bảng DON_DAT_VE & VE)
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Dữ liệu đọc trực tiếp từ các phân vùng bảng (Interval Range Partitioning) trong Oracle
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
        >
          <RefreshCw size={13} className={isLoading ? 'pulse-active' : ''} />
          Tải lại danh sách
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

      <div
        style={{
          maxHeight: 400,
          overflowY: 'auto',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(9, 12, 21, 0.6)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 12px' }}>Mã Đơn</th>
              <th style={{ padding: '10px 12px' }}>Khách Hàng</th>
              <th style={{ padding: '10px 12px' }}>Phim & Suất</th>
              <th style={{ padding: '10px 12px' }}>Ghế</th>
              <th style={{ padding: '10px 12px' }}>Tổng Tiền</th>
              <th style={{ padding: '10px 12px' }}>Ngày Đặt</th>
              <th style={{ padding: '10px 12px' }}>Trạng Thái</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)' }}>
                  Chưa có đơn đặt vé nào trong cơ sở dữ liệu. Hãy chọn ghế và đặt vé để xem đơn hàng được ghi nhận tại đây!
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o.madon}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#38bdf8' }}>#{o.madon}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div><b>{o.tenkhachhang}</b></div>
                    <small style={{ color: 'var(--text-dim)' }}>{o.sdt}</small>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div>{o.tenphim || 'Phim'}</div>
                    <small style={{ color: 'var(--text-dim)' }}>Suất #{o.masuat}</small>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {o.danhsachghe ? (
                      <span className="badge badge-purple" style={{ whiteSpace: 'normal', maxWidth: 120, display: 'inline-block' }}>
                        {o.danhsachghe}
                      </span>
                    ) : o.hangghe && o.soghe ? (
                      <span className="badge badge-purple">{o.hangghe}{o.soghe}</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>--</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#34d399' }}>
                    {Number(o.tongtien).toLocaleString()} đ
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                    {o.ngaydat}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {getStatusBadge(o.trangthai)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {o.trangthai === 'Giu cho' ? (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => handlePay(o)}
                          disabled={processingId === o.madon}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          title="Xác nhận thanh toán (Gọi PKG_DATVE.XAC_NHAN_THANH_TOAN)"
                        >
                          <CreditCard size={12} /> TT
                        </button>
                        <button
                          onClick={() => handleCancel(o)}
                          disabled={processingId === o.madon}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          title="Hủy vé (Gọi PKG_DATVE.HUY_VE)"
                        >
                          <XCircle size={12} /> Hủy
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>--</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
