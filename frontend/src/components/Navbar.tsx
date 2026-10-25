import React, { useState } from 'react';
import type { AppUser } from '../types';
import { Film, Activity, ShieldCheck, Layers, Ticket, Database, ChevronDown, Check, Trash2, BarChart3, Store } from 'lucide-react';

interface NavbarProps {
  currentUser: AppUser;
  onSelectUser: (user: AppUser) => void;
  availableUsers: AppUser[];
  activeTab: string;
  setActiveTab: (tab: any) => void;
  dbStatus: { status: string; banner?: string; dsn?: string; service_name?: string; user?: string } | null;
  onClearTestOrders: () => void;
  isClearing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  availableUsers,
  activeTab,
  setActiveTab,
  dbStatus,
  onClearTestOrders,
  isClearing,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const isConnected = dbStatus?.status === 'connected';

  const getRoleBadge = (role: string) => {
    if (role === 'KHACH') return <span className="badge badge-blue">KHÁCH HÀNG</span>;
    if (role === 'THU_NGAN') return <span className="badge badge-amber">THU NGÂN (POS)</span>;
    if (role === 'QUAN_LY') return <span className="badge badge-purple">QUẢN TRỊ / DBA</span>;
    return <span className="badge badge-green">{role}</span>;
  };

  return (
    <header className="glass-panel" style={{ position: 'relative', zIndex: 1000, padding: '16px 24px', marginBottom: 24, borderRadius: 'var(--radius-lg)' }}>
      {/* Top row: Brand & Status & User Profile Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0284c7 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.45)',
            }}
          >
            <Film size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                STAR CINEMA
              </h1>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                ORACLE 26ai FREE
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Hệ thống Rạp chiếu phim chuẩn & Quản trị Cơ sở Dữ liệu Nâng cao (QTCSDLNC)
            </p>
          </div>
        </div>

        {/* Right Controls: Database Pill + Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* DB Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#ef4444',
                boxShadow: `0 0 8px ${isConnected ? '#10b981' : '#ef4444'}`,
              }}
            />
            <div style={{ fontSize: '0.72rem' }}>
              <div style={{ fontWeight: 700, color: isConnected ? '#34d399' : '#f87171' }}>
                {isConnected ? `ORACLE ONLINE (${dbStatus?.service_name || 'FREEPDB1'})` : 'ORACLE OFFLINE'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                User: {dbStatus?.user || 'CINEMA_OWNER'}
              </div>
            </div>
          </div>

          {/* User Role Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="btn btn-outline"
              style={{
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: currentUser.vaitro === 'QUAN_LY' ? '#8b5cf6' : currentUser.vaitro === 'THU_NGAN' ? '#f59e0b' : '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                {((currentUser?.hoten || currentUser?.tendangnhap || 'U')).charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                  {currentUser?.hoten || currentUser?.tendangnhap || 'Người dùng'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {getRoleBadge(currentUser?.vaitro || 'KHACH')}
                </div>
              </div>
              <ChevronDown size={14} color="var(--text-dim)" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <>
                {/* Backdrop để click ra ngoài đóng dropdown */}
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1001,
                  }}
                  onClick={() => setShowUserDropdown(false)}
                />
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: 320,
                    maxHeight: 400,
                    overflowY: 'auto',
                    padding: 8,
                    zIndex: 1002,
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 20px rgba(56, 189, 248, 0.25)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    background: '#0a0f1d',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ padding: '8px 12px 6px', fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Chọn tài khoản kiểm thử Oracle:
                  </div>
                  {availableUsers.map((u) => {
                    const isCurrent = u.mauser === currentUser.mauser;
                    return (
                      <div
                        key={u.mauser}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserDropdown(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isCurrent ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                          transition: 'all 0.15s ease',
                          marginBottom: 4,
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: u.vaitro === 'QUAN_LY' ? '#8b5cf6' : u.vaitro === 'THU_NGAN' ? '#f59e0b' : '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: '#fff',
                            }}
                          >
                            {(u?.hoten || u?.tendangnhap || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isCurrent ? '#38bdf8' : '#f8fafc' }}>
                              {u?.hoten || u?.tendangnhap || 'Người dùng'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>
                              <code>{u?.tendangnhap}</code> • {getRoleBadge(u?.vaitro)}
                            </div>
                          </div>
                        </div>
                        {isCurrent && <Check size={18} color="#38bdf8" />}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Dọn dẹp vé nếu là quản trị hoặc thu ngân */}
          {(currentUser.vaitro === 'QUAN_LY' || currentUser.vaitro === 'THU_NGAN') && (
            <button
              onClick={onClearTestOrders}
              disabled={isClearing}
              className="btn btn-outline"
              style={{ padding: '8px 12px', fontSize: '0.74rem' }}
              title="Dọn dẹp vé thử nghiệm để trả ghế về Trống"
            >
              <Trash2 size={13} className={isClearing ? 'pulse-active' : ''} />
              {isClearing ? 'Đang dọn...' : 'Giải Phóng Ghế'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs phân quyền theo Role */}
      <nav style={{ display: 'flex', gap: 8, marginTop: 18, borderTop: '1px solid var(--border-subtle)', paddingTop: 14, overflowX: 'auto' }}>
        {/* VAI TRÒ 1: KHÁCH HÀNG (KHACH) */}
        {currentUser.vaitro === 'KHACH' && (
          <>
            <button
              onClick={() => setActiveTab('booking')}
              className={`btn ${activeTab === 'booking' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            >
              <Film size={15} />
              Đặt Vé Xem Phim
            </button>

            <button
              onClick={() => setActiveTab('my_tickets')}
              className={`btn ${activeTab === 'my_tickets' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            >
              <Ticket size={15} />
              Vé Của Tôi
            </button>
          </>
        )}

        {/* VAI TRÒ 2: THU NGÂN (THU_NGAN) */}
        {currentUser.vaitro === 'THU_NGAN' && (
          <>
            <button
              onClick={() => setActiveTab('booking')}
              className={`btn ${activeTab === 'booking' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            >
              <Store size={15} />
              Quầy Bán Vé (POS Rạp)
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            >
              <Ticket size={15} />
              Quản Lý Đơn Vé Của Rạp (VPD)
            </button>
          </>
        )}

        {/* VAI TRÒ 3: QUẢN TRỊ VIÊN / DBA (QUAN_LY) */}
        {currentUser.vaitro === 'QUAN_LY' && (
          <>
            <button
              onClick={() => setActiveTab('booking')}
              className={`btn ${activeTab === 'booking' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              <Film size={15} />
              Đặt Vé
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              <Ticket size={15} />
              Toàn Bộ Đơn Vé (DON_DAT_VE)
            </button>

            <button
              onClick={() => setActiveTab('occupancy_report')}
              className={`btn ${activeTab === 'occupancy_report' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              <BarChart3 size={15} />
              Báo Cáo Lấp Đầy (PKG_BAOCAO)
            </button>

            <button
              onClick={() => setActiveTab('testlab')}
              className={`btn ${activeTab === 'testlab' ? 'btn-accent' : 'btn-outline'}`}
              style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              <Activity size={15} />
              Test Lab Concurrency & Nhả Ghế
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              <ShieldCheck size={15} />
              Nhật Ký Kiểm Toán (NHAT_KY)
            </button>

            <button
              onClick={() => setActiveTab('data_management')}
              className={`btn ${activeTab === 'data_management' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              <Database size={15} />
              Quản Trị Bảng CSDL
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`btn ${activeTab === 'architecture' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              <Layers size={15} />
              Kiến Trúc Tablespace
            </button>
          </>
        )}
      </nav>
    </header>
  );
};
