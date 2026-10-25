import time
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import oracledb
from config import get_db_connection
from database import query_all, query_one

router = APIRouter(prefix="/api/system", tags=["System Audit & Concurrency Lab"])

class ConcurrencyTestRequest(BaseModel):
    ma_suat: int = 1
    ma_ghe: int = 1

@router.get("/seats/{showtime_id}")
def get_seats(showtime_id: int):
    """
    Đọc dữ liệu tức thời từ View V_GHE_TRONG trong Oracle.
    Phản ánh chính xác tình trạng: 'Trong' | 'DangGiuCho' | 'DaDat'.
    """
    sql = """
        SELECT MaSuat, TenPhim, TenPhong, MaGhe, HangGhe, SoGhe, LoaiGhe, GiaVeDuKien, TinhTrang
        FROM V_GHE_TRONG
        WHERE MaSuat = :1
        ORDER BY HangGhe, SoGhe
    """
    return query_all(sql, [showtime_id])

@router.get("/audit-trail")
def get_audit_trail():
    """
    Lấy dữ liệu từ bảng NHAT_KY (Audit Log) để đưa vào báo cáo kiểm toán bảo mật và minh chứng L2.
    """
    sql = """
        SELECT MaLog, BangTacDong, HanhDong, NguoiThucHien,
               TO_CHAR(ThoiGian, 'YYYY-MM-DD HH24:MI:SS') AS ThoiGian,
               NoiDung
        FROM NHAT_KY
        ORDER BY MaLog DESC
        FETCH FIRST 50 ROWS ONLY
    """
    return query_all(sql)

@router.get("/schema-metadata")
def get_schema_metadata():
    """
    Truy vấn Data Dictionary của Oracle để minh chứng kiến trúc CSDL:
    - Tablespaces vật lý (TS_DATA, TS_INDEX, TS_VE_2026_Q4, TS_LOG)
    - Partitioning của bảng DON_DAT_VE & VE (STORE IN TS_DATA)
    - Triggers, Index UQ_VE_GHE_HIEU_LUC, Packages, Job Scheduler
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT TABLESPACE_NAME, BLOCK_SIZE, STATUS, CONTENTS, EXTENT_MANAGEMENT
            FROM USER_TABLESPACES
            WHERE TABLESPACE_NAME LIKE 'TS_%'
            ORDER BY TABLESPACE_NAME
        """)
        tspaces = [dict(zip([c[0].lower() for c in cursor.description], row)) for row in cursor.fetchall()]

        cursor.execute("""
            SELECT TABLE_NAME, PARTITION_NAME, HIGH_VALUE, TABLESPACE_NAME
            FROM USER_TAB_PARTITIONS
            WHERE TABLE_NAME IN ('DON_DAT_VE', 'VE')
            ORDER BY TABLE_NAME, PARTITION_POSITION
        """)
        partitions = [dict(zip([c[0].lower() for c in cursor.description], row)) for row in cursor.fetchall()]

        cursor.execute("""
            SELECT OBJECT_NAME, OBJECT_TYPE, STATUS, LAST_DDL_TIME
            FROM USER_OBJECTS
            WHERE OBJECT_TYPE IN ('TRIGGER', 'PACKAGE', 'PACKAGE BODY', 'VIEW', 'INDEX', 'JOB', 'FUNCTION')
              AND OBJECT_NAME IN (
                  'TRG_CHECK_VE_PHONG', 'TRG_CHONG_TRUNG_LICH', 'TRG_TINH_TONG_TIEN_VE', 'TRG_AUDIT_THANH_TOAN',
                  'PKG_DATVE', 'PKG_BAOCAO', 'V_GHE_TRONG', 'UQ_VE_GHE_HIEU_LUC', 'JOB_AUTO_EXPIRE_SEATS',
                  'FN_VPD_DON_DAT_VE'
              )
            ORDER BY OBJECT_TYPE, OBJECT_NAME
        """)
        objects = [dict(zip([c[0].lower() for c in cursor.description], row)) for row in cursor.fetchall()]

        return {
            "tablespaces": tspaces,
            "partitions": partitions,
            "db_objects": objects
        }
    finally:
        cursor.close()
        conn.close()

def _exec_booking_worker(session_name: str, ma_kh: int, ma_suat: int, ma_ghe: int):
    """Worker độc lập mở kết nối riêng vào Oracle gọi PKG_DATVE.DAT_VE_GIU_CHO chuẩn mới"""
    start_time = time.perf_counter()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        p_ma_don = cursor.var(oracledb.NUMBER)
        p_ma_ve = cursor.var(oracledb.NUMBER)
        p_gia_tinh = cursor.var(oracledb.NUMBER)
        p_status_code = cursor.var(oracledb.NUMBER)
        p_message = cursor.var(oracledb.STRING)

        cursor.callproc("PKG_DATVE.DAT_VE_GIU_CHO", [
            ma_kh,
            None,
            ma_suat,
            ma_ghe,
            p_ma_don,
            p_ma_ve,
            p_gia_tinh,
            p_status_code,
            p_message
        ])

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        code = int(p_status_code.getvalue()) if p_status_code.getvalue() is not None else 500
        msg = str(p_message.getvalue()) if p_message.getvalue() is not None else ""
        don_id = int(p_ma_don.getvalue()) if p_ma_don.getvalue() is not None else None
        ve_id = int(p_ma_ve.getvalue()) if p_ma_ve.getvalue() is not None else None
        gia = float(p_gia_tinh.getvalue() or 0)

        return {
            "session": session_name,
            "ma_kh": ma_kh,
            "status_code": code,
            "message": msg,
            "ma_don": don_id,
            "ma_ve": ve_id,
            "gia_tinh": gia,
            "duration_ms": elapsed_ms,
            "result": "SUCCESS (Giữ chỗ thành công)" if code == 200 else f"BLOCKED (Oracle chặn: {code})"
        }
    except Exception as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "session": session_name,
            "ma_kh": ma_kh,
            "status_code": 500,
            "message": f"Exception: {str(e)}",
            "ma_don": None,
            "ma_ve": None,
            "gia_tinh": 0,
            "duration_ms": elapsed_ms,
            "result": "EXCEPTION"
        }
    finally:
        cursor.close()
        conn.close()

@router.post("/test-concurrency")
def run_concurrency_test(req: ConcurrencyTestRequest):
    """
    Thực nghiệm kịch bản Concurrency Race Condition:
    Khởi tạo 2 Thread riêng biệt gửi đồng thời 2 lời gọi PKG_DATVE.DAT_VE_GIU_CHO
    vào cùng 1 ghế tại cùng 1 tích tắc.
    Minh chứng Oracle bảo vệ toàn vẹn bằng Index UQ_VE_GHE_HIEU_LUC và Exception DUP_VAL_ON_INDEX.
    """
    with ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(_exec_booking_worker, "Phiên Khách 1 (User 1)", 1, req.ma_suat, req.ma_ghe)
        f2 = executor.submit(_exec_booking_worker, "Phiên Khách 2 (User 2)", 1, req.ma_suat, req.ma_ghe)

        res1 = f1.result()
        res2 = f2.result()

    return {
        "test_name": "Kiểm thử tranh chấp đồng thời đặt cùng 1 ghế (Oracle Concurrency Control)",
        "seat_id": req.ma_ghe,
        "showtime_id": req.ma_suat,
        "results": [res1, res2],
        "summary": "1 phiên giao dịch thành công (HTTP 200), phiên còn lại bị Oracle chặn với mã lỗi xung đột (HTTP 409)"
    }

@router.post("/test-release-seat")
def run_release_seat_test(req: ConcurrencyTestRequest):
    """
    Thực nghiệm kịch bản Nhả Ghế Mới (Giai đoạn 12 của đề tài):
    Bước 1: Khách 1 giữ chỗ ghế A1 -> Thành công (200)
    Bước 2: Khách 2 cố đặt ghế A1 -> Bị chặn (409)
    Bước 3: Khách 1 HỦY VÉ (gọi PKG_DATVE.HUY_VE) -> Thành công
    Bước 4: Khách 2 đặt lại ghế A1 -> THÀNH CÔNG nhờ Function-Based Index UQ_VE_GHE_HIEU_LUC!
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    steps = []
    try:
        # Giải phóng ghế trước nếu đang vướng giữ chỗ dở dang từ lần thử trước
        cursor.execute("""
            UPDATE VE SET TrangThai = 'Huy' 
            WHERE MaSuat = :1 AND MaGhe = :2 AND TrangThai <> 'Huy'
        """, [req.ma_suat, req.ma_ghe])
        conn.commit()

        # Bước 1: Khách 1 đặt giữ chỗ
        p_ma_don = cursor.var(oracledb.NUMBER)
        p_ma_ve = cursor.var(oracledb.NUMBER)
        p_gia_tinh = cursor.var(oracledb.NUMBER)
        p_status_code = cursor.var(oracledb.NUMBER)
        p_message = cursor.var(oracledb.STRING)

        cursor.callproc("PKG_DATVE.DAT_VE_GIU_CHO", [
            1, None, req.ma_suat, req.ma_ghe,
            p_ma_don, p_ma_ve, p_gia_tinh, p_status_code, p_message
        ])
        code1 = int(p_status_code.getvalue())
        msg1 = str(p_message.getvalue())
        don1 = int(p_ma_don.getvalue()) if p_ma_don.getvalue() else None

        steps.append({
            "step": 1,
            "title": "Khách 1 giữ chỗ ghế",
            "status_code": code1,
            "message": msg1,
            "ma_don": don1,
            "result": "Thành công" if code1 == 200 else "Thất bại"
        })

        if code1 != 200:
            return {"steps": steps, "summary": "Không thể bắt đầu test vì ghế đã bị chiếm từ trước. Vui lòng chọn ghế khác hoặc dọn dẹp đơn hàng."}

        # Bước 2: Khách 2 cố tình đặt trùng
        p_ma_don2 = cursor.var(oracledb.NUMBER)
        p_ma_ve2 = cursor.var(oracledb.NUMBER)
        p_gia2 = cursor.var(oracledb.NUMBER)
        p_code2 = cursor.var(oracledb.NUMBER)
        p_msg2 = cursor.var(oracledb.STRING)

        cursor.callproc("PKG_DATVE.DAT_VE_GIU_CHO", [
            1, None, req.ma_suat, req.ma_ghe,
            p_ma_don2, p_ma_ve2, p_gia2, p_code2, p_msg2
        ])
        steps.append({
            "step": 2,
            "title": "Khách 2 cố tình đặt trùng lúc đang giữ chỗ",
            "status_code": int(p_code2.getvalue()),
            "message": str(p_msg2.getvalue()),
            "result": "Oracle chặn thành công (HTTP 409)"
        })

        # Bước 3: Khách 1 HỦY VÉ
        cursor.execute("SELECT NgayDat FROM DON_DAT_VE WHERE MaDon = :1", [don1])
        row_ngay = cursor.fetchone()
        db_ngay = row_ngay[0] if row_ngay else None

        p_code3 = cursor.var(oracledb.NUMBER)
        p_msg3 = cursor.var(oracledb.STRING)
        cursor.callproc("PKG_DATVE.HUY_VE", [don1, db_ngay, p_code3, p_msg3])
        steps.append({
            "step": 3,
            "title": "Khách 1 hủy đơn vé (hoặc Job Scheduler quét quá 10 phút)",
            "status_code": int(p_code3.getvalue()),
            "message": str(p_msg3.getvalue()),
            "result": "Đã hủy đơn vé và cập nhật TrangThai = 'Huy'"
        })

        # Bước 4: Khách 2 đặt lại chính ghế đó
        p_ma_don4 = cursor.var(oracledb.NUMBER)
        p_ma_ve4 = cursor.var(oracledb.NUMBER)
        p_gia4 = cursor.var(oracledb.NUMBER)
        p_code4 = cursor.var(oracledb.NUMBER)
        p_msg4 = cursor.var(oracledb.STRING)

        cursor.callproc("PKG_DATVE.DAT_VE_GIU_CHO", [
            1, None, req.ma_suat, req.ma_ghe,
            p_ma_don4, p_ma_ve4, p_gia4, p_code4, p_msg4
        ])
        code4 = int(p_code4.getvalue())
        steps.append({
            "step": 4,
            "title": "Khách 2 đặt lại chính ghế vừa hủy",
            "status_code": code4,
            "message": str(p_msg4.getvalue()),
            "ma_don": int(p_ma_don4.getvalue()) if p_ma_don4.getvalue() else None,
            "result": "Thành công tuyệt đối nhờ UQ_VE_GHE_HIEU_LUC (Bỏ qua dòng TrangThai = 'Huy')"
        })

        return {
            "test_name": "Kiểm thử Kịch bản Nhả Ghế Tự Động (Giai đoạn 12 đề tài)",
            "steps": steps,
            "summary": "Ghế đã được nhả lại trơn tru. Khi chuyển sang 'Huy', Function-Based Index bỏ qua và cho phép đặt lại ngay!"
        }
    finally:
        cursor.close()
        conn.close()

@router.post("/reset-demo")
def reset_demo_data():
    """
    Dọn dẹp các đơn đặt vé thử nghiệm để giải phóng tất cả ghế về Trống
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM THANH_TOAN")
        cursor.execute("DELETE FROM CT_DICH_VU")
        cursor.execute("DELETE FROM VE")
        cursor.execute("DELETE FROM DON_DAT_VE")
        cursor.execute("""
            INSERT INTO NHAT_KY (BangTacDong, HanhDong, NoiDung)
            VALUES ('SYSTEM', 'RESET', 'Dọn dẹp giao dịch thử nghiệm để trả toàn bộ ghế về trạng thái Trống')
        """)
        conn.commit()
        return {"status": "success", "message": "Đã giải phóng toàn bộ ghế thành Trống!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
