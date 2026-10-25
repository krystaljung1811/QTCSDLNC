from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import query_all, query_one
from config import get_db_connection

router = APIRouter(prefix="/api/movies", tags=["Movies, Showtimes & Concessions"])

class NewMovieRequest(BaseModel):
    ten_phim: str
    the_loai: str
    thoi_luong: int
    do_tuoi: str = "P"
    ngay_khoi_chieu: Optional[str] = None
    poster_url: Optional[str] = None

class NewShowtimeRequest(BaseModel):
    ma_phim: int
    ma_phong: int = 1
    gio_bat_dau: str  # YYYY-MM-DD HH:MI:SS
    gio_ket_thuc: str # YYYY-MM-DD HH:MI:SS
    gia_co_ban: float = 100000.0

class NewCustomerRequest(BaseModel):
    ho_ten: str
    email: Optional[str] = None
    sdt: str
    diem_tich_luy: int = 0

class NewConcessionRequest(BaseModel):
    ten_dv: str
    don_gia: float

@router.get("")
def get_movies():
    """Lấy trực tiếp danh sách các bộ phim từ bảng PHIM trong Oracle"""
    sql = """
        SELECT MaPhim, TenPhim, TheLoai, ThoiLuong, DoTuoi,
               TO_CHAR(NgayKhoiChieu, 'YYYY-MM-DD') as NgayKhoiChieu,
               PosterUrl
        FROM PHIM
        ORDER BY MaPhim DESC
    """
    return query_all(sql)

@router.post("")
def create_movie(req: NewMovieRequest):
    """Thêm phim mới trực tiếp vào bảng PHIM của Oracle Database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
            INSERT INTO PHIM (TenPhim, TheLoai, ThoiLuong, DoTuoi, NgayKhoiChieu, PosterUrl)
            VALUES (:1, :2, :3, :4, TO_DATE(:5, 'YYYY-MM-DD'), :6)
        """
        cursor.execute(sql, [
            req.ten_phim,
            req.the_loai,
            req.thoi_luong,
            req.do_tuoi,
            req.ngay_khoi_chieu or "2026-10-25",
            req.poster_url or "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba"
        ])
        conn.commit()
        return {"status": "success", "message": f"Đã thêm phim '{req.ten_phim}' vào Oracle Database"}
    finally:
        cursor.close()
        conn.close()

@router.get("/showtimes")
def get_all_showtimes():
    """Lấy danh sách tất cả suất chiếu kết hợp bảng SUAT_CHIEU, PHIM, PHONG_CHIEU, RAP"""
    sql = """
        SELECT sc.MaSuat, sc.MaPhim, sc.MaPhong,
               TO_CHAR(sc.GioBatDau, 'YYYY-MM-DD HH24:MI:SS') as GioBatDau,
               TO_CHAR(sc.GioKetThuc, 'YYYY-MM-DD HH24:MI:SS') as GioKetThuc,
               sc.GiaCoBan,
               p.TenPhim, p.TheLoai, p.ThoiLuong, p.DoTuoi, p.PosterUrl,
               pc.TenPhong, pc.LoaiPhong, pc.SoGhe,
               r.TenRap, r.DiaChi
        FROM SUAT_CHIEU sc
        JOIN PHIM p ON sc.MaPhim = p.MaPhim
        JOIN PHONG_CHIEU pc ON sc.MaPhong = pc.MaPhong
        JOIN RAP r ON pc.MaRap = r.MaRap
        ORDER BY sc.GioBatDau DESC
    """
    return query_all(sql)

@router.post("/showtimes")
def create_showtime(req: NewShowtimeRequest):
    """Thêm suất chiếu mới vào bảng SUAT_CHIEU"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
            INSERT INTO SUAT_CHIEU (MaPhim, MaPhong, GioBatDau, GioKetThuc, GiaCoBan)
            VALUES (:1, :2, TO_TIMESTAMP(:3, 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP(:4, 'YYYY-MM-DD HH24:MI:SS'), :5)
        """
        cursor.execute(sql, [
            req.ma_phim,
            req.ma_phong,
            req.gio_bat_dau,
            req.gio_ket_thuc,
            req.gia_co_ban
        ])
        conn.commit()
        return {"status": "success", "message": "Đã tạo suất chiếu mới thành công trong Oracle Database"}
    finally:
        cursor.close()
        conn.close()

@router.get("/{movie_id}/showtimes")
def get_movie_showtimes(movie_id: int):
    """Lấy các suất chiếu của 1 bộ phim cụ thể"""
    sql = """
        SELECT sc.MaSuat, sc.MaPhim, sc.MaPhong,
               TO_CHAR(sc.GioBatDau, 'YYYY-MM-DD HH24:MI:SS') as GioBatDau,
               TO_CHAR(sc.GioKetThuc, 'YYYY-MM-DD HH24:MI:SS') as GioKetThuc,
               sc.GiaCoBan,
               pc.TenPhong, pc.LoaiPhong, pc.SoGhe,
               r.TenRap, r.DiaChi
        FROM SUAT_CHIEU sc
        JOIN PHONG_CHIEU pc ON sc.MaPhong = pc.MaPhong
        JOIN RAP r ON pc.MaRap = r.MaRap
        WHERE sc.MaPhim = :1
        ORDER BY sc.GioBatDau
    """
    return query_all(sql, [movie_id])

@router.get("/concessions/all")
def get_concessions():
    """Lấy trực tiếp danh sách bắp nước từ bảng DICH_VU trong Oracle"""
    # Nếu bảng DICH_VU đang trống, tự động nạp các mục cơ bản vào Oracle
    existing = query_all("SELECT MaDV, TenDV, DonGia FROM DICH_VU ORDER BY MaDV")
    if not existing:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO DICH_VU (TenDV, DonGia) VALUES ('Bắp Rang Bơ Phô Mai (Lớn)', 55000)")
            cursor.execute("INSERT INTO DICH_VU (TenDV, DonGia) VALUES ('Coca Cola Tươi 500ml', 35000)")
            cursor.execute("INSERT INTO DICH_VU (TenDV, DonGia) VALUES ('Combo 1 Bắp + 2 Nước', 110000)")
            conn.commit()
            existing = query_all("SELECT MaDV, TenDV, DonGia FROM DICH_VU ORDER BY MaDV")
        finally:
            cursor.close()
            conn.close()
    return existing

@router.get("/customers/all")
def get_customers():
    """Lấy trực tiếp danh sách khách hàng từ bảng KHACH_HANG trong Oracle"""
    sql = "SELECT MaKH, HoTen, Email, SDT, DiemTichLuy FROM KHACH_HANG ORDER BY MaKH"
    return query_all(sql)

@router.post("/customers")
def create_customer(req: NewCustomerRequest):
    """Thêm khách hàng mới trực tiếp vào bảng KHACH_HANG"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
            INSERT INTO KHACH_HANG (HoTen, Email, SDT, DiemTichLuy)
            VALUES (:1, :2, :3, :4)
        """
        cursor.execute(sql, [req.ho_ten, req.email, req.sdt, req.diem_tich_luy])
        conn.commit()
        return {"status": "success", "message": f"Đã thêm khách hàng '{req.ho_ten}' vào Oracle Database"}
    finally:
        cursor.close()
        conn.close()

@router.get("/staff/all")
def get_staff():
    """Lấy danh sách nhân viên từ bảng NHAN_VIEN"""
    sql = "SELECT MaNV, MaRap, HoTen, ChucVu FROM NHAN_VIEN ORDER BY MaNV"
    return query_all(sql)
