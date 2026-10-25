export interface Seat {
  masuat: number;
  tenphim: string;
  tenphong: string;
  maghe: number;
  hangghe: string;
  soghe: number;
  loaighe: 'Thuong' | 'VIP' | 'Doi';
  giavedukien: number;
  tinhtrang: 'Trong' | 'DangGiuCho' | 'DaDat';
}

export interface AuditLog {
  malog: number;
  bangtacdong: string;
  hanhdong: string;
  nguoithuchien: string;
  thoigian: string;
  noidung: string;
}

export interface Movie {
  maphim: number;
  tenphim: string;
  theloai: string;
  thoiluong: number;
  dotuoi: string;
  ngaykhoichieu: string;
  posterurl: string;
}

export interface Showtime {
  masuat: number;
  maphim: number;
  maphong: number;
  giobatdau: string;
  gioketthuc: string;
  giacoban: number;
  tenphim: string;
  theloai: string;
  thoiluong: number;
  dotuoi: string;
  posterurl: string;
  tenphong: string;
  loaiphong: string;
  soghe: number;
  tenrap: string;
  diachi: string;
}

export interface Customer {
  makh: number;
  hoten: string;
  email: string | null;
  sdt: string;
  diemtichluy: number;
}

export interface Concession {
  madv: number;
  tendv: string;
  dongia: number;
}

export interface ConcessionCartItem {
  concession: Concession;
  quantity: number;
}

export interface Staff {
  manv: number;
  hoten: string;
  chucvu: string;
}

export interface AppUser {
  mauser: number;
  tendangnhap: string;
  vaitro: 'KHACH' | 'THU_NGAN' | 'QUAN_LY';
  hoten: string;
  makh?: number | null;
  manv?: number | null;
}

export interface ConcurrencyTestResult {
  session: string;
  ma_kh: number;
  status_code: number;
  message: string;
  ma_don: number | null;
  ma_ve: number | null;
  duration_ms: number;
  result: string;
}

export interface ConcurrencyTestResponse {
  test_name: string;
  seat_id: number;
  showtime_id: number;
  results: ConcurrencyTestResult[];
  summary: string;
}

export interface ReleaseSeatStep {
  step: number;
  title: string;
  status_code: number;
  message: string;
  ma_don?: number | null;
  result: string;
}

export interface ReleaseSeatResponse {
  test_name: string;
  steps: ReleaseSeatStep[];
  summary: string;
}

export interface DbMetadata {
  tablespaces: Array<{
    tablespace_name: string;
    block_size: number;
    status: string;
    contents: string;
    extent_management: string;
  }>;
  partitions: Array<{
    table_name: string;
    partition_name: string;
    high_value: string;
    tablespace_name: string;
  }>;
  db_objects: Array<{
    object_name: string;
    object_type: string;
    status: string;
    last_ddl_time: string;
  }>;
}

export interface OrderItem {
  madon: number;
  ngaydat: string;
  trangthai: string;
  tongtien: number;
  makh?: number;
  thoigianhethan?: string;
  tenkhachhang: string;
  sdt: string;
  danhsachghe?: string;
  soluongve?: number;
  hangghe?: string;
  soghe?: number;
  tenphim?: string;
  masuat?: number;
  tenphong?: string;
  tenrap?: string;
}
