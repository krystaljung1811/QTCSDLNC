from typing import Optional, List, Union
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import oracledb
from config import get_db_connection
from database import query_all, query_one

router = APIRouter(prefix="/api/booking", tags=["Booking Management"])

class MultipleSeatBookingRequest(BaseModel):
    ma_kh: int = 1
    ma_nv: Optional[int] = None
    ma_suat: int
    ma_ghe: Optional[int] = None
    ma_ghe_list: Optional[List[int]] = None

class PaymentConfirmRequest(BaseModel):
    ma_don: int
    ngay_dat: Optional[str] = None
    phuong_thuc: str = "The"  # 'Tien mat', 'The', 'Vi dien tu'
    so_tien: Optional[float] = None

class CancelBookingRequest(BaseModel):
    ma_don: int
    ngay_dat: Optional[str] = None

@router.post("/reserve")
def reserve_seat(req: MultipleSeatBookingRequest):
    """
    Gọi trực tiếp thủ tục PL/SQL PKG_DATVE.DAT_VE_GIU_CHO và PKG_DATVE.THEM_GHE_VAO_DON.
    - Giá vé được tính toán chuẩn tại tầng Oracle Server (Function TINH_GIA_VE_CHUAN).
    - Hỗ trợ đặt 1 hoặc nhiều ghế cùng lúc trong một đơn hàng.
    - Oracle bảo vệ chống tranh chấp đồng thời bằng Index UQ_VE_GHE_HIEU_LUC.
    """
    seats_to_book = []
    if req.ma_ghe_list and len(req.ma_ghe_list) > 0:
        seats_to_book = req.ma_ghe_list
    elif req.ma_ghe is not None:
        seats_to_book = [req.ma_ghe]
    else:
        raise HTTPException(status_code=400, detail="Vui lòng chọn ít nhất 1 ghế")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Bước 1: Đặt ghế đầu tiên với PKG_DATVE.DAT_VE_GIU_CHO để khởi tạo đơn hàng
        first_seat = seats_to_book[0]
        p_ma_don = cursor.var(oracledb.NUMBER)
        p_ma_ve = cursor.var(oracledb.NUMBER)
        p_gia_tinh = cursor.var(oracledb.NUMBER)
        p_status_code = cursor.var(oracledb.NUMBER)
        p_message = cursor.var(oracledb.STRING)

        cursor.callproc("PKG_DATVE.DAT_VE_GIU_CHO", [
            req.ma_kh,
            req.ma_nv,
            req.ma_suat,
            first_seat,
            p_ma_don,
            p_ma_ve,
            p_gia_tinh,
            p_status_code,
            p_message
        ])

        res_code = int(p_status_code.getvalue()) if p_status_code.getvalue() is not None else 500
        res_msg = str(p_message.getvalue()) if p_message.getvalue() is not None else "Không có phản hồi từ CSDL"

        if res_code != 200:
            raise HTTPException(status_code=res_code, detail=res_msg)

        ma_don_id = int(p_ma_don.getvalue())
        ma_ve_list = [int(p_ma_ve.getvalue())]
        tong_tien_tinh = float(p_gia_tinh.getvalue() or 0)

        # Lấy NgayDat chính xác từ bảng DON_DAT_VE để gọi tiếp THEM_GHE_VAO_DON
        cursor.execute("SELECT NgayDat FROM DON_DAT_VE WHERE MaDon = :1", [ma_don_id])
        row_order = cursor.fetchone()
        db_ngay_dat = row_order[0] if row_order else None

        # Bước 2: Nếu có thêm các ghế tiếp theo, gọi PKG_DATVE.THEM_GHE_VAO_DON
        for extra_seat in seats_to_book[1:]:
            p_ve_extra = cursor.var(oracledb.NUMBER)
            p_gia_extra = cursor.var(oracledb.NUMBER)
            p_code_extra = cursor.var(oracledb.NUMBER)
            p_msg_extra = cursor.var(oracledb.STRING)

            cursor.callproc("PKG_DATVE.THEM_GHE_VAO_DON", [
                ma_don_id,
                db_ngay_dat,
                req.ma_suat,
                extra_seat,
                p_ve_extra,
                p_gia_extra,
                p_code_extra,
                p_msg_extra
            ])

            code_extra = int(p_code_extra.getvalue()) if p_code_extra.getvalue() is not None else 500
            if code_extra != 200:
                # Nếu 1 ghế trong danh sách bị trùng, báo lỗi chi tiết
                raise HTTPException(status_code=code_extra, detail=f"Ghế #{extra_seat}: {p_msg_extra.getvalue()}")

            ma_ve_list.append(int(p_ve_extra.getvalue()))
            tong_tien_tinh += float(p_gia_extra.getvalue() or 0)

        # Lấy lại tổng tiền và thời gian hết hạn hold do Trigger TRG_TINH_TONG_TIEN_VE tự động cộng dồn
        cursor.execute("""
            SELECT TongTien, TO_CHAR(NgayDat, 'YYYY-MM-DD"T"HH24:MI:SS.FF3'),
                   TO_CHAR(ThoiGianHetHanHold, 'YYYY-MM-DD HH24:MI:SS')
            FROM DON_DAT_VE WHERE MaDon = :1
        """, [ma_don_id])
        order_meta = cursor.fetchone()
        real_tong_tien = float(order_meta[0]) if order_meta else tong_tien_tinh
        ngay_dat_str = order_meta[1] if order_meta else None
        het_han_str = order_meta[2] if order_meta else None

        return {
            "status": "success",
            "ma_don": ma_don_id,
            "ma_ve_list": ma_ve_list,
            "tong_tien": real_tong_tien,
            "ngay_dat": ngay_dat_str,
            "thoi_gian_het_han": het_han_str,
            "message": f"Giữ chỗ thành công {len(seats_to_book)} ghế. Hết hạn sau 10 phút."
        }
    finally:
        cursor.close()
        conn.close()

@router.post("/confirm-payment")
def confirm_payment(req: PaymentConfirmRequest):
    """
    Gọi trực tiếp thủ tục PL/SQL PKG_DATVE.XAC_NHAN_THANH_TOAN.
    - Cập nhật trạng thái DON_DAT_VE sang 'Da TT'.
    - Cập nhật trạng thái VE sang 'Da dung'.
    - Ghi nhận bản ghi vào THANH_TOAN.
    - Trigger TRG_AUDIT_THANH_TOAN tự động ghi log vào bảng NHAT_KY.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT NgayDat, TongTien FROM DON_DAT_VE WHERE MaDon = :1", [req.ma_don])
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy đơn đặt vé #{req.ma_don}")
        
        db_ngay_dat, db_tong_tien = row
        so_tien_final = req.so_tien if req.so_tien is not None else float(db_tong_tien)

        p_status_code = cursor.var(oracledb.NUMBER)
        p_message = cursor.var(oracledb.STRING)

        cursor.callproc("PKG_DATVE.XAC_NHAN_THANH_TOAN", [
            req.ma_don,
            db_ngay_dat,
            req.phuong_thuc,
            so_tien_final,
            p_status_code,
            p_message
        ])

        res_code = int(p_status_code.getvalue()) if p_status_code.getvalue() is not None else 500
        res_msg = str(p_message.getvalue()) if p_message.getvalue() is not None else "Không có phản hồi từ CSDL"

        if res_code != 200:
            raise HTTPException(status_code=res_code, detail=res_msg)

        return {
            "status": "success",
            "ma_don": req.ma_don,
            "so_tien": so_tien_final,
            "phuong_thuc": req.phuong_thuc,
            "message": res_msg
        }
    finally:
        cursor.close()
        conn.close()

@router.post("/cancel")
def cancel_booking(req: CancelBookingRequest):
    """
    Gọi trực tiếp thủ tục PL/SQL PKG_DATVE.HUY_VE.
    Hủy vé và nhả lại ghế ngay lập tức nhờ Function-Based Index UQ_VE_GHE_HIEU_LUC.
    Trigger TRG_TINH_TONG_TIEN_VE tự động trừ tổng tiền.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT NgayDat FROM DON_DAT_VE WHERE MaDon = :1", [req.ma_don])
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy đơn #{req.ma_don}")
        db_ngay_dat = row[0]

        p_status_code = cursor.var(oracledb.NUMBER)
        p_message = cursor.var(oracledb.STRING)

        cursor.callproc("PKG_DATVE.HUY_VE", [
            req.ma_don,
            db_ngay_dat,
            p_status_code,
            p_message
        ])

        res_code = int(p_status_code.getvalue()) if p_status_code.getvalue() is not None else 500
        res_msg = str(p_message.getvalue()) if p_message.getvalue() is not None else "Không có phản hồi từ CSDL"

        if res_code != 200:
            raise HTTPException(status_code=res_code, detail=res_msg)

        return {
            "status": "success",
            "ma_don": req.ma_don,
            "message": res_msg
        }
    finally:
        cursor.close()
        conn.close()

@router.get("/orders")
def list_orders(role: Optional[str] = None, user_id: Optional[str] = None, ma_kh: Optional[int] = None):
    """
    Tra cứu danh sách đơn đặt vé từ bảng phân vùng DON_DAT_VE.
    Hỗ trợ phân quyền:
    - Nếu là Khách hàng: Chỉ xem đơn của chính khách đó.
    - Nếu là Thu ngân / Quản lý: Xem đơn theo phân quyền rạp (VPD Policy).
    """
    where_sql = ""
    params = []
    if ma_kh:
        where_sql = "WHERE d.MaKH = :1"
        params.append(ma_kh)

    sql = f"""
        SELECT d.MaDon, TO_CHAR(d.NgayDat, 'YYYY-MM-DD HH24:MI:SS') as NgayDat,
               d.TrangThai, d.TongTien, d.MaKH,
               TO_CHAR(d.ThoiGianHetHanHold, 'YYYY-MM-DD HH24:MI:SS') as ThoiGianHetHan,
               kh.HoTen as TenKhachHang, kh.SDT,
               (
                   SELECT LISTAGG(g.HangGhe || g.SoGhe, ', ') WITHIN GROUP (ORDER BY g.HangGhe, g.SoGhe)
                   FROM VE v2
                   JOIN GHE g ON v2.MaGhe = g.MaGhe
                   WHERE v2.MaDon = d.MaDon AND v2.NgayDat = d.NgayDat AND v2.TrangThai <> 'Huy'
               ) as DanhSachGhe,
               (
                   SELECT COUNT(*)
                   FROM VE v3
                   WHERE v3.MaDon = d.MaDon AND v3.NgayDat = d.NgayDat AND v3.TrangThai <> 'Huy'
               ) as SoLuongVe,
               p.TenPhim, sc.MaSuat, pc.TenPhong, r.TenRap
        FROM DON_DAT_VE d
        JOIN KHACH_HANG kh ON d.MaKH = kh.MaKH
        LEFT JOIN (
            SELECT DISTINCT MaDon, NgayDat, MaSuat
            FROM VE
        ) v ON d.MaDon = v.MaDon AND d.NgayDat = v.NgayDat
        LEFT JOIN SUAT_CHIEU sc ON v.MaSuat = sc.MaSuat
        LEFT JOIN PHIM p ON sc.MaPhim = p.MaPhim
        LEFT JOIN PHONG_CHIEU pc ON sc.MaPhong = pc.MaPhong
        LEFT JOIN RAP r ON pc.MaRap = r.MaRap
        {where_sql}
        ORDER BY d.MaDon DESC
        FETCH FIRST 40 ROWS ONLY
    """
    return query_all(sql, params)

@router.get("/occupancy/{showtime_id}")
def get_occupancy_rate(showtime_id: int):
    """Gọi Function PKG_BAOCAO.TINH_TY_LE_LAP_DAY để lấy tỷ lệ lấp đầy phòng chiếu"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        res = cursor.callfunc("PKG_BAOCAO.TINH_TY_LE_LAP_DAY", oracledb.NUMBER, [showtime_id])
        return {
            "showtime_id": showtime_id,
            "occupancy_rate": float(res or 0)
        }
    finally:
        cursor.close()
        conn.close()
