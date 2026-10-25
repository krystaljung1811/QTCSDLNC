import os
import oracledb
from dotenv import load_dotenv

# Tải cấu hình từ file .env
load_dotenv()

# Cấu hình kết nối Oracle Database 26ai Free qua Service Name FREEPDB1 (Không dùng SID xe)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "1521")
DB_SERVICE_NAME = os.getenv("DB_SERVICE_NAME", "FREEPDB1")

# DSN chuẩn định dạng Service Name: localhost:1521/FREEPDB1
DEFAULT_DSN = f"{DB_HOST}:{DB_PORT}/{DB_SERVICE_NAME}"
DB_DSN = os.getenv("DB_DSN", DEFAULT_DSN)

DB_USER = os.getenv("DB_USER", "CINEMA_OWNER")
DB_PASSWORD = os.getenv("DB_PASSWORD", "CinemaPass123#")
DB_SCHEMA = os.getenv("DB_SCHEMA", "CINEMA_OWNER")

def get_db_connection():
    """
    Tạo kết nối trực tiếp đến Oracle Database 26ai qua Service Name FREEPDB1 (Thin Mode).
    Tự động thử mật khẩu CinemaPass123# hoặc ngocanh1106 để đảm bảo không bị gián đoạn.
    """
    passwords_to_try = [DB_PASSWORD, "CinemaPass123#", "ngocanh1106"]
    last_err = None
    for pwd in passwords_to_try:
        try:
            conn = oracledb.connect(
                user=DB_USER,
                password=pwd,
                dsn=DB_DSN
            )
            conn.autocommit = False

            if DB_USER.upper() != DB_SCHEMA.upper():
                cur = conn.cursor()
                cur.execute(f"ALTER SESSION SET CURRENT_SCHEMA = {DB_SCHEMA}")
                cur.close()

            return conn
        except Exception as e:
            last_err = e
            continue
    raise last_err

def check_db_health():
    """Kiểm tra kết nối và phiên bản Oracle Database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT BANNER FROM V$VERSION WHERE ROWNUM = 1")
        row = cursor.fetchone()
        version = row[0] if row else "Oracle Database 26ai Free"

        # Kiểm tra số lượng rạp chiếu phim để xác nhận schema
        cursor.execute("SELECT COUNT(*) FROM RAP")
        rap_count = cursor.fetchone()[0]

        cursor.close()
        conn.close()
        return {
            "status": "connected",
            "banner": version,
            "user": DB_USER,
            "schema": DB_SCHEMA,
            "service_name": DB_SERVICE_NAME,
            "dsn": DB_DSN,
            "rap_count": rap_count
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e),
            "user": DB_USER,
            "schema": DB_SCHEMA,
            "service_name": DB_SERVICE_NAME,
            "dsn": DB_DSN
        }
