import { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import type { Seat, AuditLog, Showtime, Movie, Customer, Concession, OrderItem, AppUser } from './types';
import {
  FALLBACK_MOVIES,
  FALLBACK_SHOWTIMES,
  FALLBACK_SEATS,
  FALLBACK_CUSTOMERS,
  FALLBACK_CONCESSIONS,
  FALLBACK_USERS,
} from './api/fallbackData';
import { Navbar } from './components/Navbar';
import { BookingPage } from './pages/BookingPage';
import { TestLabPage } from './pages/TestLabPage';
import { AuditViewer } from './components/AuditViewer';
import { SchemaViewer } from './components/SchemaViewer';
import { OrderManager } from './components/OrderManager';
import { DataEntityManager } from './components/DataEntityManager';
import { OccupancyReport } from './components/OccupancyReport';
import { MyTickets } from './components/MyTickets';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('booking');

  // Quản lý người dùng và vai trò đăng nhập
  const [availableUsers, setAvailableUsers] = useState<AppUser[]>(FALLBACK_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser>(FALLBACK_USERS[0]);

  // Dữ liệu đọc 100% từ Oracle Database (kèm fallback dự phòng)
  const [seats, setSeats] = useState<Seat[]>(FALLBACK_SEATS);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>(FALLBACK_SHOWTIMES);
  const [movies, setMovies] = useState<Movie[]>(FALLBACK_MOVIES);
  const [customers, setCustomers] = useState<Customer[]>(FALLBACK_CUSTOMERS);
  const [concessions, setConcessions] = useState<Concession[]>(FALLBACK_CONCESSIONS);
  const [orders, setOrders] = useState<OrderItem[]>([]);

  const [currentShowtimeId, setCurrentShowtimeId] = useState<number>(1);
  const [dbStatus, setDbStatus] = useState<{ status: string; banner?: string; dsn?: string; service_name?: string; user?: string } | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // 1. Tải sơ đồ ghế từ View V_GHE_TRONG cho suất chiếu đang chọn
  const fetchSeats = useCallback(async (stId?: number) => {
    const id = stId || currentShowtimeId;
    try {
      const data = await api.getSeats(id);
      setSeats(Array.isArray(data) && data.length > 0 ? data : FALLBACK_SEATS);
    } catch (e) {
      console.error('Lỗi nạp sơ đồ ghế từ Oracle:', e);
    }
  }, [currentShowtimeId]);

  // 2. Tải Audit Logs từ bảng NHAT_KY
  const fetchLogs = useCallback(async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Lỗi nạp audit logs từ Oracle:', e);
    }
  }, []);

  // 3. Tải danh sách đơn đặt vé thực tế từ bảng DON_DAT_VE & VE
  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Lỗi nạp đơn hàng:', e);
    }
  }, []);

  // 4. Tải toàn bộ dữ liệu master từ CSDL (Phim, Suất chiếu, Khách hàng, Bắp nước, Người dùng)
  const fetchAllMasterData = useCallback(async () => {
    setIsLoading(true);
    try {
      const health = await api.getHealth();
      setDbStatus(health);
    } catch (e) {
      setDbStatus({ status: 'disconnected' });
    }

    try {
      const [mvList, stList, custList, concList, userList] = await Promise.all([
        api.getMovies(),
        api.getShowtimes(),
        api.getCustomers(),
        api.getConcessions(),
        api.getUsers().catch(() => FALLBACK_USERS),
      ]);

      const safeMovies = Array.isArray(mvList) && mvList.length > 0 ? mvList : FALLBACK_MOVIES;
      const safeShowtimes = Array.isArray(stList) && stList.length > 0 ? stList : FALLBACK_SHOWTIMES;
      const safeCustomers = Array.isArray(custList) && custList.length > 0 ? custList : FALLBACK_CUSTOMERS;
      const safeConcessions = Array.isArray(concList) && concList.length > 0 ? concList : FALLBACK_CONCESSIONS;
      const safeUsers = Array.isArray(userList) && userList.length > 0 ? userList : FALLBACK_USERS;

      setMovies(safeMovies);
      setShowtimes(safeShowtimes);
      setCustomers(safeCustomers);
      setConcessions(safeConcessions);
      setAvailableUsers(safeUsers);

      if (safeShowtimes.length > 0 && (!currentShowtimeId || !safeShowtimes.some((s) => s.masuat === currentShowtimeId))) {
        setCurrentShowtimeId(safeShowtimes[0].masuat);
        await fetchSeats(safeShowtimes[0].masuat);
      } else {
        await fetchSeats();
      }
    } catch (e) {
      console.error('Lỗi nạp dữ liệu master:', e);
    }

    await Promise.all([fetchLogs(), fetchOrders()]);
    setIsLoading(false);
  }, [fetchSeats, fetchLogs, fetchOrders, currentShowtimeId]);

  useEffect(() => {
    fetchAllMasterData();
  }, [fetchAllMasterData]);

  // Polling tự động làm mới trạng thái ghế và đơn hàng
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      fetchSeats();
      fetchLogs();
      fetchOrders();
    }, 2500);
    return () => clearInterval(interval);
  }, [isPolling, fetchSeats, fetchLogs, fetchOrders]);

  // Chọn hoặc bỏ chọn ghế
  const handleToggleSeat = (seat: Seat) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.maghe === seat.maghe);
      if (exists) {
        return prev.filter((s) => s.maghe !== seat.maghe);
      } else {
        return [...prev, seat];
      }
    });
  };

  // Dọn dẹp đơn vé thử nghiệm
  const handleClearTestOrders = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả các vé thử nghiệm và trả toàn bộ ghế về Trống?')) {
      return;
    }
    setIsClearing(true);
    try {
      await api.clearTestOrders();
      setSelectedSeats([]);
      await Promise.all([fetchSeats(), fetchLogs(), fetchOrders()]);
    } catch (e: any) {
      alert('Lỗi khi dọn dẹp: ' + (e.response?.data?.detail || e.message));
    } finally {
      setIsClearing(false);
    }
  };

  // Khi chuyển vai trò người dùng, tự động chuyển về tab phù hợp
  const handleSelectUser = (u: AppUser) => {
    setCurrentUser(u);
    if (u.vaitro === 'KHACH') {
      setActiveTab('booking');
    } else if (u.vaitro === 'THU_NGAN') {
      setActiveTab('booking');
    } else {
      setActiveTab('orders');
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px 60px' }}>
      {/* Navbar Điều Hướng & Trạng Thái Oracle & Chuyển Đổi Vai Trò */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        availableUsers={availableUsers}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        onClearTestOrders={handleClearTestOrders}
        isClearing={isClearing}
      />

      {/* Main Content Render theo Tab */}
      <main>
        {activeTab === 'booking' && (
          <BookingPage
            seats={seats}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            onClearSelectedSeats={() => setSelectedSeats([])}
            onRefreshData={() => {
              fetchSeats();
              fetchLogs();
              fetchOrders();
            }}
            showtimes={showtimes}
            movies={movies}
            customers={customers}
            concessions={concessions}
            currentShowtimeId={currentShowtimeId}
            onSelectShowtime={(id) => {
              setCurrentShowtimeId(id);
              fetchSeats(id);
              setSelectedSeats([]);
            }}
            currentUser={currentUser}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'my_tickets' && (
          <MyTickets
            orders={orders}
            currentUser={currentUser}
            onRefresh={() => {
              fetchOrders();
              fetchSeats();
              fetchLogs();
            }}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'orders' && (
          <OrderManager
            orders={orders}
            onRefresh={() => {
              fetchOrders();
              fetchSeats();
              fetchLogs();
            }}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'occupancy_report' && (
          <OccupancyReport showtimes={showtimes} />
        )}

        {activeTab === 'testlab' && (
          <TestLabPage
            seats={seats}
            onRefreshData={() => {
              fetchSeats();
              fetchLogs();
              fetchOrders();
            }}
          />
        )}

        {activeTab === 'audit' && (
          <AuditViewer
            logs={logs}
            onRefresh={() => {
              fetchLogs();
            }}
            isPolling={isPolling}
            setIsPolling={setIsPolling}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'data_management' && (
          <DataEntityManager
            movies={movies}
            customers={customers}
            concessions={concessions}
            onRefreshAll={fetchAllMasterData}
          />
        )}

        {activeTab === 'architecture' && <SchemaViewer />}
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: 48,
          paddingTop: 20,
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div>
          Hệ Thống Đặt Vé Rạp Chiếu Phim Chuẩn • <b>Đề tài Thạc sĩ Quản trị CSDL Nâng cao</b>
        </div>
        <div>
          Cơ sở dữ liệu: <b>Oracle Database 26ai Free (Service Name: FREEPDB1)</b> • Phân quyền VPD (FGAC) • Index UQ_VE_GHE_HIEU_LUC • PKG_DATVE & PKG_BAOCAO
        </div>
      </footer>
    </div>
  );
}
