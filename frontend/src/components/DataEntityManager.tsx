import React, { useState } from 'react';
import type { Movie, Customer, Concession } from '../types';
import { api } from '../api/client';
import { PlusCircle, Database, Film, UserPlus, Coffee, CheckCircle, AlertCircle } from 'lucide-react';

interface DataEntityManagerProps {
  movies: Movie[];
  customers: Customer[];
  concessions: Concession[];
  onRefreshAll: () => void;
}

export const DataEntityManager: React.FC<DataEntityManagerProps> = ({
  movies,
  customers,
  concessions,
  onRefreshAll,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'movies' | 'customers' | 'concessions'>('movies');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newMovie, setNewMovie] = useState({
    ten_phim: '',
    the_loai: 'Hành động / Viễn tưởng',
    thoi_luong: 120,
    do_tuoi: 'T16',
    ngay_khoi_chieu: '2026-10-25',
    poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
  });

  const [newCustomer, setNewCustomer] = useState({
    ho_ten: '',
    email: '',
    sdt: '',
    diem_tich_luy: 0,
  });

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovie.ten_phim) return;
    setIsSubmitting(true);
    setMsg(null);
    try {
      const res = await api.createMovie(newMovie);
      setMsg({ type: 'success', text: res.message });
      setNewMovie({
        ten_phim: '',
        the_loai: 'Hành động / Viễn tưởng',
        thoi_luong: 120,
        do_tuoi: 'T16',
        ngay_khoi_chieu: '2026-10-25',
        poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
      });
      onRefreshAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.ho_ten || !newCustomer.sdt) return;
    setIsSubmitting(true);
    setMsg(null);
    try {
      const res = await api.createCustomer(newCustomer);
      setMsg({ type: 'success', text: res.message });
      setNewCustomer({ ho_ten: '', email: '', sdt: '', diem_tich_luy: 0 });
      onRefreshAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={20} color="#34d399" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Quản Trị Bảng Dữ Liệu Oracle (Thêm Mới Phim & Khách Hàng)
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Tác động trực tiếp vào các bảng Master <code>PHIM</code>, <code>KHACH_HANG</code>, <code>DICH_VU</code> trên tablespace <code>TS_DATA</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveSubTab('movies')}
            className={`btn ${activeSubTab === 'movies' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '0.75rem' }}
          >
            <Film size={14} /> Phim ({movies.length})
          </button>
          <button
            onClick={() => setActiveSubTab('customers')}
            className={`btn ${activeSubTab === 'customers' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '0.75rem' }}
          >
            <UserPlus size={14} /> Khách Hàng ({customers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('concessions')}
            className={`btn ${activeSubTab === 'concessions' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '0.75rem' }}
          >
            <Coffee size={14} /> Bắp Nước ({concessions.length})
          </button>
        </div>
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

      {/* Subtab 1: Movies */}
      {activeSubTab === 'movies' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>
              Danh Sách Phim Hiện Có Trong Bảng PHIM:
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
              {movies.map((m) => (
                <div
                  key={m.maphim}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <img
                    src={m.posterurl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba'}
                    alt={m.tenphim}
                    style={{ width: 50, height: 70, objectFit: 'cover', borderRadius: 4 }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{m.tenphim}</b>
                      <span className="badge badge-amber">{m.dotuoi}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Thể loại: <b>{m.theloai}</b> • Thời lượng: <b>{m.thoiluong} phút</b>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>
                      Mã Phim: #{m.maphim} • Khởi chiếu: {m.ngaykhoichieu}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form thêm phim */}
          <form
            onSubmit={handleAddMovie}
            style={{
              padding: 18,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#38bdf8' }}>
              + Thêm Phim Mới Vào Bảng PHIM
            </h4>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tên Phim:</label>
              <input
                type="text"
                value={newMovie.ten_phim}
                onChange={(e) => setNewMovie({ ...newMovie, ten_phim: e.target.value })}
                required
                placeholder="Ví dụ: Dune: Part Two, Avatar..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '0.8rem' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Thể Loại:</label>
                <input
                  type="text"
                  value={newMovie.the_loai}
                  onChange={(e) => setNewMovie({ ...newMovie, the_loai: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Thời Lượng (Phút):</label>
                <input
                  type="number"
                  value={newMovie.thoi_luong}
                  onChange={(e) => setNewMovie({ ...newMovie, thoi_luong: Number(e.target.value) })}
                  min={1}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Độ Tuổi:</label>
              <select
                value={newMovie.do_tuoi}
                onChange={(e) => setNewMovie({ ...newMovie, do_tuoi: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '0.8rem' }}
              >
                <option value="P">P - Phổ biến mọi lứa tuổi</option>
                <option value="T13">T13 - Khán giả từ 13 tuổi</option>
                <option value="T16">T16 - Khán giả từ 16 tuổi</option>
                <option value="T18">T18 - Khán giả từ 18 tuổi</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ marginTop: 8 }}
            >
              <PlusCircle size={14} /> Thêm Phim Vào Oracle
            </button>
          </form>
        </div>
      )}

      {/* Subtab 2: Customers */}
      {activeSubTab === 'customers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>
              Danh Sách Khách Hàng (Bảng KHACH_HANG):
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {customers.map((c) => (
                <div
                  key={c.makh}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem' }}>
                      {c.hoten} <small style={{ color: 'var(--text-dim)' }}>(MaKH: #{c.makh})</small>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      SĐT: <b>{c.sdt}</b> • Email: {c.email || 'N/A'}
                    </div>
                  </div>
                  <span className="badge badge-green">{c.diemtichluy} Điểm</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form thêm khách hàng */}
          <form
            onSubmit={handleAddCustomer}
            style={{
              padding: 18,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#34d399' }}>
              + Thêm Khách Hàng Mới
            </h4>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Họ Tên:</label>
              <input
                type="text"
                value={newCustomer.ho_ten}
                onChange={(e) => setNewCustomer({ ...newCustomer, ho_ten: e.target.value })}
                required
                placeholder="Nguyễn Thị B, Trần C..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '0.8rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Số Điện Thoại:</label>
              <input
                type="text"
                value={newCustomer.sdt}
                onChange={(e) => setNewCustomer({ ...newCustomer, sdt: e.target.value })}
                required
                placeholder="0987654321"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '0.8rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email (Tùy chọn):</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="khachhang@gmail.com"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '0.8rem' }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ marginTop: 8 }}
            >
              <UserPlus size={14} /> Thêm Vào Bảng KHACH_HANG
            </button>
          </form>
        </div>
      )}

      {/* Subtab 3: Concessions */}
      {activeSubTab === 'concessions' && (
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>
            Dịch Vụ Bắp Nước Khách Hàng Có Thể Chọn Kèm (Bảng DICH_VU):
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {concessions.map((c) => (
              <div
                key={c.madv}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <b style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{c.tendv}</b>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>Mã Dịch Vụ: #{c.madv}</div>
                </div>
                <span className="badge badge-amber">{Number(c.dongia).toLocaleString()} VNĐ</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
