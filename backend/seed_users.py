import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('backend')
from config import get_db_connection

def seed_accounts():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # 1. Thêm Khách hàng 2 & 3 vào KHACH_HANG
        cur.execute("SELECT COUNT(*) FROM KHACH_HANG WHERE Email = 'binh.tran@gmail.com'")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO KHACH_HANG (HoTen, Email, SDT, DiemTichLuy) 
                VALUES ('Trần Thị Bình', 'binh.tran@gmail.com', '0987654321', 120)
            """)
        
        cur.execute("SELECT COUNT(*) FROM KHACH_HANG WHERE Email = 'cuong.pham@gmail.com'")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO KHACH_HANG (HoTen, Email, SDT, DiemTichLuy) 
                VALUES ('Phạm Minh Cường', 'cuong.pham@gmail.com', '0933445566', 20)
            """)

        # 2. Thêm Thu ngân 2 vào NHAN_VIEN
        cur.execute("SELECT COUNT(*) FROM NHAN_VIEN WHERE TenUserOracle = 'TN_02'")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO NHAN_VIEN (MaRap, HoTen, ChucVu, TenUserOracle) 
                VALUES (1, 'Nguyễn Hoàng Nam', 'Thu ngan', 'TN_02')
            """)

        conn.commit()

        # 3. Lấy ID
        cur.execute("SELECT MaKH FROM KHACH_HANG WHERE Email = 'binh.tran@gmail.com'")
        makh2 = cur.fetchone()[0]

        cur.execute("SELECT MaKH FROM KHACH_HANG WHERE Email = 'cuong.pham@gmail.com'")
        makh3 = cur.fetchone()[0]

        cur.execute("SELECT MaNV FROM NHAN_VIEN WHERE TenUserOracle = 'TN_02'")
        manv_tn2 = cur.fetchone()[0]

        # 4. Thêm vào NGUOI_DUNG
        # khach02
        cur.execute("SELECT COUNT(*) FROM NGUOI_DUNG WHERE LOWER(TenDangNhap) = 'khach02'")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO NGUOI_DUNG (TenDangNhap, MatKhauHash, VaiTro, MaKH, MaNV)
                VALUES ('khach02', STANDARD_HASH('Pass123456#', 'SHA256'), 'KHACH', :1, NULL)
            """, [makh2])

        # khach03
        cur.execute("SELECT COUNT(*) FROM NGUOI_DUNG WHERE LOWER(TenDangNhap) = 'khach03'")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO NGUOI_DUNG (TenDangNhap, MatKhauHash, VaiTro, MaKH, MaNV)
                VALUES ('khach03', STANDARD_HASH('Pass123456#', 'SHA256'), 'KHACH', :1, NULL)
            """, [makh3])

        # thungan02
        cur.execute("SELECT COUNT(*) FROM NGUOI_DUNG WHERE LOWER(TenDangNhap) = 'thungan02'")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO NGUOI_DUNG (TenDangNhap, MatKhauHash, VaiTro, MaKH, MaNV)
                VALUES ('thungan02', STANDARD_HASH('Pass123456#', 'SHA256'), 'THU_NGAN', NULL, :1)
            """, [manv_tn2])

        conn.commit()
        print("Successfully seeded multiple accounts into Oracle Database!")
    except Exception as e:
        conn.rollback()
        print("Error during seed:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    seed_accounts()
