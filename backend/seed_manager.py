import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('backend')
from config import get_db_connection

def ensure_manager():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) FROM NHAN_VIEN WHERE ChucVu = 'Quan ly'")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO NHAN_VIEN (MaRap, HoTen, ChucVu, TenUserOracle) 
                VALUES (1, 'Trần Quản Lý', 'Quan ly', 'QL_01')
            """)
            cur.execute("SELECT MaNV FROM NHAN_VIEN WHERE TenUserOracle = 'QL_01'")
            manv = cur.fetchone()[0]
            cur.execute("""
                INSERT INTO NGUOI_DUNG (TenDangNhap, MatKhauHash, VaiTro, MaKH, MaNV) 
                VALUES ('admin', STANDARD_HASH('Pass123456#', 'SHA256'), 'QUAN_LY', NULL, :1)
            """, [manv])
            conn.commit()
            print("Successfully added manager 'admin' (Trần Quản Lý) into Oracle Database!")
        else:
            print("Manager already exists in Oracle Database.")
    except Exception as e:
        conn.rollback()
        print("Error:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    ensure_manager()
