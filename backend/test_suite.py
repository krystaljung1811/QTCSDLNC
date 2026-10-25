import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('backend')

from config import check_db_health, get_db_connection
from routers.admin import run_release_seat_test, ConcurrencyTestRequest
from database import query_all

def main():
    print("==================================================================")
    print("1. KIEM TRA KET NOI ORACLE DATABASE")
    health = check_db_health()
    print("Health Status:", health.get("status"))
    print("Oracle Banner:", health.get("banner"))
    print("Service Name :", health.get("service_name"))
    print("Schema User  :", health.get("user"))

    print("\n==================================================================")
    print("2. KIEM TRA CAC VAI TRO TRONG NGUOI_DUNG & NHAN_VIEN")
    users = query_all("SELECT MaUser, TenDangNhap, VaiTro FROM NGUOI_DUNG ORDER BY MaUser")
    for u in users:
        print(f"  - User: {u['tendangnhap']:<12} | Role: {u['vaitro']:<10}")

    print("\n==================================================================")
    print("3. KIEM TRA DAT NHIEU GHE DONG THOI (PKG_DATVE.THEM_GHE_VAO_DON)")
    from routers.admin import reset_demo_data
    reset_demo_data()
    from routers.booking import reserve_seat, MultipleSeatBookingRequest
    from fastapi import HTTPException
    
    # Khách 1 (khach01) đặt 2 ghế A1 và A2
    req_multi = MultipleSeatBookingRequest(ma_kh=1, ma_suat=1, ma_ghe_list=[1, 2])
    res_multi = reserve_seat(req_multi)
    print(f"  Khach 1 dat thanh cong 2 ghe A1, A2 -> Don #{res_multi['ma_don']}, Tong tien: {res_multi['tong_tien']:,} VND")
    
    # Khách 2 (khach02) cố tình đặt trùng ghế A1
    req_conflict = MultipleSeatBookingRequest(ma_kh=21, ma_suat=1, ma_ghe_list=[1])
    try:
        reserve_seat(req_conflict)
        print("  FAIL: Khach 2 khong bi chan!")
    except HTTPException as ex:
        print(f"  PASS: Khach 2 bi Oracle chan giao dich trung ghe A1 -> HTTP {ex.status_code}: {ex.detail}")

    print("\n==================================================================")
    print("4. KIEM TRA THUC NGHIEM NHA GHE (UQ_VE_GHE_HIEU_LUC)")
    res = run_release_seat_test(ConcurrencyTestRequest(ma_suat=1, ma_ghe=5))
    print("Result Summary:", res.get("summary"))
    for s in res.get("steps", []):
        print(f"  Step {s['step']}: {s['title']} -> HTTP {s['status_code']} | {s['result']}")

    print("\n==================================================================")
    print("5. KIEM TRA SO DO GHE VIEW V_GHE_TRONG")
    seats = query_all("SELECT HangGhe, SoGhe, LoaiGhe, GiaVeDuKien, TinhTrang FROM V_GHE_TRONG WHERE MaSuat = 1 AND ROWNUM <= 5")
    for s in seats:
        print(f"  Seat {s['hangghe']}{s['soghe']} ({s['loaighe']}) -> {s['giavedukien']:,} VND | Status: {s['tinhtrang']}")

    print("\n==================================================================")
    print("TAT CA KIEM TRA HOAN TAT VA SAN SANG TRINH CHIEU BAO VE!")

if __name__ == '__main__':
    main()
