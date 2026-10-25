import axios from 'axios';
import type {
  Seat,
  AuditLog,
  Movie,
  Showtime,
  ConcurrencyTestResponse,
  ReleaseSeatResponse,
  DbMetadata,
  OrderItem,
  Customer,
  Concession,
  Staff,
  AppUser
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Kiểm tra kết nối Oracle Database
  getHealth: async () => {
    const res = await apiClient.get('/api/health');
    return res.data;
  },

  // Danh sách Người Dùng & Phân Quyền (Bảng NGUOI_DUNG)
  getUsers: async (): Promise<AppUser[]> => {
    const res = await apiClient.get<AppUser[]>('/api/auth/users');
    return res.data;
  },

  login: async (credentials: { username: string; password: string }) => {
    const res = await apiClient.post('/api/auth/login', credentials);
    return res.data;
  },

  // Danh sách Phim từ bảng PHIM
  getMovies: async (): Promise<Movie[]> => {
    const res = await apiClient.get<Movie[]>('/api/movies');
    return res.data;
  },

  createMovie: async (movie: {
    ten_phim: string;
    the_loai: string;
    thoi_luong: number;
    do_tuoi: string;
    ngay_khoi_chieu?: string;
    poster_url?: string;
  }) => {
    const res = await apiClient.post('/api/movies', movie);
    return res.data;
  },

  // Danh sách Suất chiếu (SUAT_CHIEU)
  getShowtimes: async (): Promise<Showtime[]> => {
    const res = await apiClient.get<Showtime[]>('/api/movies/showtimes');
    return res.data;
  },

  createShowtime: async (showtime: {
    ma_phim: number;
    ma_phong: number;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    gia_co_ban: number;
  }) => {
    const res = await apiClient.post('/api/movies/showtimes', showtime);
    return res.data;
  },

  // Sơ đồ ghế từ Oracle View V_GHE_TRONG
  getSeats: async (showtimeId: number = 1): Promise<Seat[]> => {
    const res = await apiClient.get<Seat[]>(`/api/system/seats/${showtimeId}`);
    return res.data;
  },

  // Khách hàng từ bảng KHACH_HANG
  getCustomers: async (): Promise<Customer[]> => {
    const res = await apiClient.get<Customer[]>('/api/movies/customers/all');
    return res.data;
  },

  createCustomer: async (customer: {
    ho_ten: string;
    email?: string;
    sdt: string;
    diem_tich_luy?: number;
  }) => {
    const res = await apiClient.post('/api/movies/customers', customer);
    return res.data;
  },

  // Dịch vụ bắp nước từ bảng DICH_VU
  getConcessions: async (): Promise<Concession[]> => {
    const res = await apiClient.get<Concession[]>('/api/movies/concessions/all');
    return res.data;
  },

  // Nhân viên từ bảng NHAN_VIEN
  getStaff: async (): Promise<Staff[]> => {
    const res = await apiClient.get<Staff[]>('/api/movies/staff/all');
    return res.data;
  },

  // Nhật ký kiểm toán CSDL từ bảng NHAT_KY
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await apiClient.get<AuditLog[]>('/api/system/audit-trail');
    return res.data;
  },

  // Đặt vé giữ chỗ gọi Stored Procedure PKG_DATVE.DAT_VE_GIU_CHO & THEM_GHE_VAO_DON
  reserveSeats: async (params: {
    ma_kh: number;
    ma_nv?: number | null;
    ma_suat: number;
    ma_ghe_list: number[];
  }) => {
    const res = await apiClient.post('/api/booking/reserve', {
      ma_kh: params.ma_kh,
      ma_nv: params.ma_nv || null,
      ma_suat: params.ma_suat,
      ma_ghe_list: params.ma_ghe_list,
    });
    return res.data;
  },

  // Xác nhận thanh toán gọi Stored Procedure PKG_DATVE.XAC_NHAN_THANH_TOAN
  confirmPayment: async (params: {
    ma_don: number;
    phuong_thuc?: string;
    so_tien?: number;
  }) => {
    const res = await apiClient.post('/api/booking/confirm-payment', params);
    return res.data;
  },

  // Hủy vé gọi Stored Procedure PKG_DATVE.HUY_VE
  cancelBooking: async (params: { ma_don: number }) => {
    const res = await apiClient.post('/api/booking/cancel', params);
    return res.data;
  },

  // Lấy danh sách đơn đặt vé thực tế từ bảng DON_DAT_VE & VE
  getOrders: async (role?: string, makh?: number): Promise<OrderItem[]> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (makh) params.append('ma_kh', makh.toString());
    const res = await apiClient.get<OrderItem[]>(`/api/booking/orders?${params.toString()}`);
    return res.data;
  },

  // Lấy tỷ lệ lấp đầy từ PKG_BAOCAO.TINH_TY_LE_LAP_DAY
  getOccupancyRate: async (showtimeId: number): Promise<{ showtime_id: number; occupancy_rate: number }> => {
    const res = await apiClient.get(`/api/booking/occupancy/${showtimeId}`);
    return res.data;
  },

  // Thực nghiệm tranh chấp đồng thời (2 luồng song song)
  runConcurrencyTest: async (params: {
    ma_suat: number;
    ma_ghe: number;
  }): Promise<ConcurrencyTestResponse> => {
    const res = await apiClient.post<ConcurrencyTestResponse>('/api/system/test-concurrency', params);
    return res.data;
  },

  // Thực nghiệm nhả ghế tự động (UQ_VE_GHE_HIEU_LUC)
  runReleaseSeatTest: async (params: {
    ma_suat: number;
    ma_ghe: number;
  }): Promise<ReleaseSeatResponse> => {
    const res = await apiClient.post<ReleaseSeatResponse>('/api/system/test-release-seat', params);
    return res.data;
  },

  // Dọn dẹp đơn vé thử nghiệm
  clearTestOrders: async () => {
    const res = await apiClient.post('/api/system/reset-demo');
    return res.data;
  },

  // Tra cứu siêu dữ liệu kiến trúc CSDL (Tablespace, Partition, Trigger, Package)
  getSchemaMetadata: async (): Promise<DbMetadata> => {
    const res = await apiClient.get<DbMetadata>('/api/system/schema-metadata');
    return res.data;
  },
};
