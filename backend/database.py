import datetime
from decimal import Decimal
import oracledb
from config import get_db_connection

def serialize_row(cols, row):
    """Chuyển đổi kiểu dữ liệu Oracle (TIMESTAMP, NUMBER, LOB) sang dạng JSON serialize được"""
    item = {}
    for col, val in zip(cols, row):
        key = col.lower()
        if isinstance(val, (datetime.datetime, datetime.date)):
            item[key] = val.isoformat()
        elif isinstance(val, Decimal):
            item[key] = float(val) if '.' in str(val) else int(val)
        else:
            item[key] = val
    return item

def query_all(sql: str, params=None):
    """Thực thi câu truy vấn SELECT và trả về danh sách dict"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(sql, params or [])
        if not cursor.description:
            return []
        cols = [c[0] for c in cursor.description]
        rows = cursor.fetchall()
        return [serialize_row(cols, r) for r in rows]
    finally:
        cursor.close()
        conn.close()

def query_one(sql: str, params=None):
    """Thực thi câu truy vấn SELECT và trả về 1 dict hoặc None"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(sql, params or [])
        if not cursor.description:
            return None
        cols = [c[0] for c in cursor.description]
        row = cursor.fetchone()
        return serialize_row(cols, row) if row else None
    finally:
        cursor.close()
        conn.close()
