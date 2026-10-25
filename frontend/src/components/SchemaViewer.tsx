import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { DbMetadata } from '../types';
import { HardDrive, Calendar, Cpu, CheckCircle } from 'lucide-react';

export const SchemaViewer: React.FC = () => {
  const [metadata, setMetadata] = useState<DbMetadata | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await api.getSchemaMetadata();
        setMetadata(data);
      } catch (err) {
        console.error('Failed to load schema metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Overview Banner */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
          Kiến Trúc Quản Trị Cơ Sở Dữ Liệu Nâng Cao (Oracle Database 23ai / 26ai)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Hệ thống được thiết kế theo chuẩn phân tách vật lý (Physical Storage Separation),
          phân vùng bảng tự động theo thời gian (Interval Range Partitioning) và bảo vệ toàn vẹn dữ liệu
          bằng Stored Procedures & Triggers mức Server, đảm bảo đáp ứng chuẩn đầu ra của đề tài thạc sĩ.
        </p>
      </div>

      {/* Grid: 3 Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Pillar 1: Tablespaces */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(2, 132, 199, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                1. Kiến Trúc Tablespaces Vật Lý
              </h3>
              <small style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Phân tách I/O & Cô lập rủi ro</small>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ color: '#38bdf8', fontSize: '0.82rem' }}>TS_DATA</b>
                <span className="badge badge-blue">Dữ liệu Master</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Lưu trữ các bảng danh mục: RAP, PHONG_CHIEU, GHE, PHIM, SUAT_CHIEU, KHACH_HANG, NHAN_VIEN.
              </p>
            </div>

            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ color: '#fbbf24', fontSize: '0.82rem' }}>TS_INDEX</b>
                <span className="badge badge-amber">Chỉ mục Index</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Tách biệt các B-Tree Indexes để giảm hiện tượng nghẽn I/O (Disk Head Contention).
              </p>
            </div>

            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ color: '#34d399', fontSize: '0.82rem' }}>TS_VE_2026_Q4</b>
                <span className="badge badge-green">Giao dịch Partition</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Lưu trữ các phân vùng giao dịch đặt vé cao điểm Quý 4/2026 của bảng DON_DAT_VE & VE.
              </p>
            </div>

            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ color: '#c084fc', fontSize: '0.82rem' }}>TS_LOG</b>
                <span className="badge badge-purple">Audit Log</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Tablespace chuyên dụng lưu vết bảo mật bảng NHAT_KY, ngăn ngừa tràn đĩa hệ thống.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 2: Partitioning */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="#f59e0b" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                2. Interval Range Partitioning
              </h3>
              <small style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Tối ưu truy vấn & Bảo trì theo tháng</small>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
            Bảng <code>DON_DAT_VE</code> và <code>VE</code> áp dụng phân vùng theo cột <b>NgayDat</b> với chu kỳ:
            <div style={{ margin: '8px 0', padding: 10, background: 'rgba(0, 0, 0, 0.4)', borderRadius: 6, fontFamily: 'monospace', color: '#7dd3fc', fontSize: '0.75rem' }}>
              PARTITION BY RANGE (NgayDat)<br />
              INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'))
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: '#e2e8f0' }}>
              <CheckCircle size={14} color="#10b981" />
              <span><b>Tự động sinh Partition:</b> Oracle tự tạo partition mới khi sang tháng tiếp theo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: '#e2e8f0' }}>
              <CheckCircle size={14} color="#10b981" />
              <span><b>Partition Pruning:</b> Bộ tối ưu CBO chỉ quét đúng partition của tháng cần tìm</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: '#10b981' }}>
              <CheckCircle size={14} color="#10b981" />
              <span><b>Rolling Window Archival:</b> Dễ dàng Drop / Truncate dữ liệu vé cũ mà không khóa bảng</span>
            </div>
          </div>

          {metadata?.partitions && metadata.partitions.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Danh sách phân vùng thực tế:</span>
              <div style={{ maxHeight: 120, overflowY: 'auto', marginTop: 4 }}>
                {metadata.partitions.map((p, idx) => (
                  <div key={idx} style={{ fontSize: '0.72rem', padding: '4px 6px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                    <span><b>{p.table_name}</b>: {p.partition_name}</span>
                    <span style={{ color: '#38bdf8' }}>{p.tablespace_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pillar 3: PL/SQL Packages & Triggers */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={20} color="#a855f7" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                3. Điều Phối Nghiệp Vụ Tại Oracle Server
              </h3>
              <small style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Thủ tục lưu trữ & Ràng buộc toàn vẹn</small>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <b style={{ color: '#a855f7', fontSize: '0.82rem' }}>Package PKG_DATVE</b>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Gói PL/SQL bao gồm <code>DAT_VE_GIU_CHO</code>, <code>XAC_NHAN_THANH_TOAN</code>, <code>HUY_VE</code>.
                Xử lý lock dòng, bắt ngoại lệ <code>DUP_VAL_ON_INDEX</code>, tự động ghi Audit Log.
              </p>
            </div>

            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <b style={{ color: '#f43f5e', fontSize: '0.82rem' }}>Trigger TRG_CHECK_VE_PHONG</b>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Trigger <code>BEFORE INSERT OR UPDATE ON VE</code> xác minh mã phòng của ghế trùng khớp với mã phòng của suất chiếu,
                chặn hoàn toàn việc đặt nhầm phòng ở tầng CSDL.
              </p>
            </div>

            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <b style={{ color: '#0ea5e9', fontSize: '0.82rem' }}>View V_GHE_TRONG</b>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                View tính toán tức thời trạng thái 'Trong', 'DangGiuCho', 'DaDat' cùng giá vé tương ứng theo loại ghế VIP/Thường/Đôi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
