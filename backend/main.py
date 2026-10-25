from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import check_db_health
from routers import booking, movies, admin, auth

app = FastAPI(
    title="Cinema Oracle Management Interface (QTCSDLNC)",
    description="Hệ thống Backend FastAPI giao tiếp trực tiếp Oracle Database 23ai/26ai (Thin Mode), điều phối Stored Procedures PKG_DATVE, View V_GHE_TRONG và Audit Log NHAT_KY.",
    version="1.0.0"
)

# Cấu hình CORS mở rộng cho Frontend kết nối
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các router nghiệp vụ
app.include_router(auth.router)
app.include_router(booking.router)
app.include_router(movies.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {
        "project": "Xây dựng và quản trị cơ sở dữ liệu cho hệ thống đặt vé rạp chiếu phim",
        "database": "Oracle Database 23ai / 26ai (FREEPDB1)",
        "architecture": "Stored Procedures + Packages + Triggers + Partitioning + Audit Logs",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return check_db_health()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
