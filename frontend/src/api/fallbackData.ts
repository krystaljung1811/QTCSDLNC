import type { Movie, Showtime, Seat, Customer, Concession, AppUser, DbMetadata } from '../types';

export const FALLBACK_MOVIES: Movie[] = [
  {
    maphim: 1001,
    tenphim: 'Oppenheimer',
    theloai: 'Lịch sử / Chính kịch',
    thoiluong: 180,
    dotuoi: 'T18',
    ngaykhoichieu: '2026-10-01',
    posterurl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop',
  },
  {
    maphim: 1000,
    tenphim: 'Avatar: Dòng Chảy Của Nước',
    theloai: 'Khoa học viễn tưởng',
    thoiluong: 192,
    dotuoi: 'P',
    ngaykhoichieu: '2026-10-15',
    posterurl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop',
  },
  {
    maphim: 999,
    tenphim: 'Interstellar: Hố Đen Tử Thần',
    theloai: 'Khoa học viễn tưởng / Phiêu lưu',
    thoiluong: 169,
    dotuoi: 'T13',
    ngaykhoichieu: '2026-10-20',
    posterurl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&auto=format&fit=crop',
  },
];

export const FALLBACK_SHOWTIMES: Showtime[] = [
  {
    masuat: 1,
    maphim: 1001,
    maphong: 1,
    giobatdau: '2026-10-25 19:00:00',
    gioketthuc: '2026-10-25 22:00:00',
    giacoban: 100000,
    tenphim: 'Oppenheimer',
    theloai: 'Lịch sử / Chính kịch',
    thoiluong: 180,
    dotuoi: 'T18',
    posterurl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop',
    tenphong: 'Phòng 01 (IMAX Laser)',
    loaiphong: 'IMAX',
    soghe: 20,
    tenrap: 'Cinema Star Cầu Giấy',
    diachi: '298 Cầu Giấy, Hà Nội',
  },
  {
    masuat: 2,
    maphim: 1000,
    maphong: 1,
    giobatdau: '2026-10-25 22:30:00',
    gioketthuc: '2026-10-26 01:45:00',
    giacoban: 120000,
    tenphim: 'Avatar: Dòng Chảy Của Nước',
    theloai: 'Khoa học viễn tưởng',
    thoiluong: 192,
    dotuoi: 'P',
    posterurl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop',
    tenphong: 'Phòng 01 (IMAX Laser)',
    loaiphong: 'IMAX',
    soghe: 20,
    tenrap: 'Cinema Star Cầu Giấy',
    diachi: '298 Cầu Giấy, Hà Nội',
  },
];

export const FALLBACK_SEATS: Seat[] = [
  // Hàng A (1-10)
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 1, hangghe: 'A', soghe: 1, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 2, hangghe: 'A', soghe: 2, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 3, hangghe: 'A', soghe: 3, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 4, hangghe: 'A', soghe: 4, loaighe: 'VIP', giavedukien: 120000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 5, hangghe: 'A', soghe: 5, loaighe: 'VIP', giavedukien: 120000, tinhtrang: 'DangGiuCho' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 6, hangghe: 'A', soghe: 6, loaighe: 'VIP', giavedukien: 120000, tinhtrang: 'DaDat' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 7, hangghe: 'A', soghe: 7, loaighe: 'VIP', giavedukien: 120000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 8, hangghe: 'A', soghe: 8, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 9, hangghe: 'A', soghe: 9, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 10, hangghe: 'A', soghe: 10, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  // Hàng B (1-10)
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 11, hangghe: 'B', soghe: 1, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 12, hangghe: 'B', soghe: 2, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 13, hangghe: 'B', soghe: 3, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 14, hangghe: 'B', soghe: 4, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 15, hangghe: 'B', soghe: 5, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 16, hangghe: 'B', soghe: 6, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 17, hangghe: 'B', soghe: 7, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 18, hangghe: 'B', soghe: 8, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 19, hangghe: 'B', soghe: 9, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
  { masuat: 1, tenphim: 'Oppenheimer', tenphong: 'Phòng 01 (IMAX Laser)', maghe: 20, hangghe: 'B', soghe: 10, loaighe: 'Thuong', giavedukien: 100000, tinhtrang: 'Trong' },
];

export const FALLBACK_CUSTOMERS: Customer[] = [
  { makh: 1, hoten: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', sdt: '0912345678', diemtichluy: 50 },
  { makh: 2, hoten: 'Trần Thị Bình', email: 'binh.tran@gmail.com', sdt: '0987654321', diemtichluy: 120 },
  { makh: 3, hoten: 'Phạm Minh Cường', email: 'cuong.pham@gmail.com', sdt: '0933445566', diemtichluy: 20 },
];

export const FALLBACK_CONCESSIONS: Concession[] = [
  { madv: 1, tendv: 'Bắp rang bơ phô mai', dongia: 45000 },
  { madv: 2, tendv: 'Pepsi cỡ lớn', dongia: 30000 },
  { madv: 3, tendv: 'Combo 1 Bắp 2 Nước', dongia: 85000 },
];

export const FALLBACK_USERS: AppUser[] = [
  { mauser: 1, tendangnhap: 'khach01', vaitro: 'KHACH', hoten: 'Nguyễn Văn An', makh: 1, manv: null },
  { mauser: 2, tendangnhap: 'khach02', vaitro: 'KHACH', hoten: 'Trần Thị Bình', makh: 2, manv: null },
  { mauser: 3, tendangnhap: 'khach03', vaitro: 'KHACH', hoten: 'Phạm Minh Cường', makh: 3, manv: null },
  { mauser: 4, tendangnhap: 'thungan01', vaitro: 'THU_NGAN', hoten: 'Lê Thu Ngân (Quầy 01)', makh: null, manv: 1 },
  { mauser: 5, tendangnhap: 'thungan02', vaitro: 'THU_NGAN', hoten: 'Nguyễn Hoàng Nam (Quầy 02)', makh: null, manv: 2 },
  { mauser: 999, tendangnhap: 'admin', vaitro: 'QUAN_LY', hoten: 'Trần Quản Lý (DBA)', makh: null, manv: null },
];

export const FALLBACK_METADATA: DbMetadata = {
  tablespaces: [
    { tablespace_name: 'TS_DATA', block_size: 8192, status: 'ONLINE', contents: 'PERMANENT', extent_management: 'LOCAL' },
    { tablespace_name: 'TS_INDEX', block_size: 8192, status: 'ONLINE', contents: 'PERMANENT', extent_management: 'LOCAL' },
    { tablespace_name: 'TS_VE_2026_Q4', block_size: 8192, status: 'ONLINE', contents: 'PERMANENT', extent_management: 'LOCAL' },
    { tablespace_name: 'TS_LOG', block_size: 8192, status: 'ONLINE', contents: 'PERMANENT', extent_management: 'LOCAL' },
  ],
  partitions: [
    { table_name: 'DON_DAT_VE', partition_name: 'P_INIT', high_value: "TIMESTAMP' 2026-10-01 00:00:00'", tablespace_name: 'TS_DATA' },
    { table_name: 'DON_DAT_VE', partition_name: 'P_2026_Q4', high_value: "TIMESTAMP' 2027-01-01 00:00:00'", tablespace_name: 'TS_VE_2026_Q4' },
    { table_name: 'VE', partition_name: 'P_VE_INIT', high_value: "TIMESTAMP' 2026-10-01 00:00:00'", tablespace_name: 'TS_DATA' },
    { table_name: 'VE', partition_name: 'P_VE_2026_Q4', high_value: "TIMESTAMP' 2027-01-01 00:00:00'", tablespace_name: 'TS_VE_2026_Q4' },
  ],
  db_objects: [
    { object_name: 'PKG_DATVE', object_type: 'PACKAGE BODY', status: 'VALID', last_ddl_time: '2026-10-25 18:40:00' },
    { object_name: 'PKG_BAOCAO', object_type: 'PACKAGE BODY', status: 'VALID', last_ddl_time: '2026-10-25 18:40:00' },
    { object_name: 'UQ_VE_GHE_HIEU_LUC', object_type: 'INDEX (FUNCTION-BASED)', status: 'VALID', last_ddl_time: '2026-10-25 18:00:00' },
    { object_name: 'TRG_TINH_TONG_TIEN_VE', object_type: 'TRIGGER', status: 'VALID', last_ddl_time: '2026-10-25 18:00:00' },
    { object_name: 'JOB_AUTO_EXPIRE_SEATS', object_type: 'JOB', status: 'ENABLED', last_ddl_time: '2026-10-25 18:00:00' },
  ],
};
