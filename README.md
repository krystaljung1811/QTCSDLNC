# HỆ THỐNG QUẢN TRỊ VÀ ĐẶT VÉ RẠP CHIẾU PHIM (ORACLE DATABASE 23ai / 26ai)

**Môn học:** Quản trị Cơ sở Dữ liệu Nâng cao (QTCSDLNC)  
**Mục tiêu:** Xây dựng hệ thống hoàn chỉnh kết nối trực tiếp Oracle Database PDB (`FREEPDB1`), đẩy toàn bộ kiểm soát giao dịch, ràng buộc toàn vẹn, bảo vệ tranh chấp đồng thời (Concurrency Control) và ghi vết kiểm toán (Audit Trail) xuống mức CSDL thông qua PL/SQL Stored Procedures & Triggers.

---

## 1. Cấu Trúc Mã Nguồn Dự Án

```
├── database/
│   └── schema.sql              # Toàn bộ mã nguồn DDL Tablespaces, Tables, Partition, Packages, Triggers, Views & Seed data
│
├── backend/                    # Python + FastAPI (Giao tiếp trực tiếp Oracle Database Thin Mode)
│   ├── requirements.txt        # Thư viện: fastapi, uvicorn, python-oracledb, pydantic, python-dotenv
│   ├── config.py               # Kết nối Oracle Thin Mode (user CINEMA_OWNER, autocommit=False)
│   ├── database.py             # Hàm wrapper truy vấn SQL & Stored Procedure
│   ├── routers/
│   │   ├── booking.py          # API gọi PKG_DATVE.DAT_VE_GIU_CHO, XAC_NHAN_THANH_TOAN, HUY_VE
│   │   ├── movies.py           # API danh mục Phim, Suất chiếu, Bắp nước
│   │   └── admin.py            # API đọc View V_GHE_TRONG, Audit Log NHAT_KY, Test Lab Concurrency
│   └── main.py                 # File khởi chạy chính FastAPI (CORS, Health Check, Docs)
│
├── frontend/                   # React + TypeScript + Vite (Giao diện Dark Cinema UI siêu trực quan)
│   ├── package.json
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts       # Axios client gọi sang backend
│   │   ├── types.ts            # Khai báo TypeScript types
│   │   ├── components/
│   │   │   ├── Navbar.tsx      # Thanh điều hướng, đèn báo kết nối Oracle Live
│   │   │   ├── SeatMap.tsx     # Sơ đồ ghế tương tác, màn hình cong laser IMAX
│   │   │   ├── AuditViewer.tsx # Bảng kiểm toán CSDL thời gian thực từ bảng NHAT_KY (Minh chứng L2)
│   │   │   └── SchemaViewer.tsx # Trực quan hóa kiến trúc Tablespaces, Partitioning & Packages
│   │   ├── pages/
│   │   │   ├── BookingPage.tsx # Đặt vé giữ chỗ 10 phút, thanh toán, hủy vé
│   │   │   └── TestLabPage.tsx # Thực nghiệm mô phỏng 2 phiên tranh chấp đồng thời (Race Condition)
│   │   ├── App.tsx             # Điều phối trạng thái, auto-polling định kỳ 2.5s
│   │   ├── index.css           # Design system sang trọng, glassmorphism, glowing effects
│   │   └── main.tsx
│
├── start_backend.bat           # File khởi động nhanh Backend FastAPI
├── start_frontend.bat          # File khởi động nhanh Frontend Vite
└── start_all.bat               # File khởi động toàn bộ hệ thống 1 cú click chuột
```

---

## 2. Các Trụ Cột Quản Trị CSDL Nâng Cao Trong Đề Tài

1. **Kiến Trúc Lưu Trữ Vật Lý Tách Biệt (Physical Storage Separation):**
   - `TS_DATA`: Lưu trữ các bảng nghiệp vụ Master (RAP, PHONG_CHIEU, GHE, PHIM, SUAT_CHIEU, KHACH_HANG, NHAN_VIEN).
   - `TS_INDEX`: Tách biệt lưu trữ B-Tree Index nhằm giảm hiện tượng tranh chấp đầu đọc (Disk Head Contention).
   - `TS_VE_2026_Q4`: Tablespace chuyên dụng chứa phân vùng giao dịch đặt vé cao điểm Quý 4/2026.
   - `TS_LOG`: Lưu vết kiểm toán bảng `NHAT_KY`, độc lập để tránh ảnh hưởng dung lượng hệ thống vận hành.

2. **Phân Vùng Bảng Tự Động (Interval Range Partitioning):**
   - Hai bảng lớn nhất hệ thống `DON_DAT_VE` và `VE` được phân vùng theo tháng trên cột `NgayDat`:
     ```sql
     PARTITION BY RANGE (NgayDat) 
     INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'))
     ```
   - Cho phép Oracle tự động tạo phân vùng mới theo thời gian mà không cần can thiệp thủ công, tối ưu hóa câu truy vấn bằng kỹ thuật **Partition Pruning**.

3. **Kiểm Soát Giao Dịch & Tranh Chấp Đồng Thời (Concurrency & Locking):**
   - Backend sử dụng `autocommit=False` với `python-oracledb` Thin Mode. Quyền điều phối giao dịch thuộc trọn vẹn về Stored Procedure `PKG_DATVE.DAT_VE_GIU_CHO`.
   - Bảo vệ toàn vẹn bằng ràng buộc duy nhất `UQ_VE_SUAT_GHE (MaSuat, MaGhe)`.
   - Bẫy lỗi ngoại lệ `WHEN DUP_VAL_ON_INDEX THEN ROLLBACK; p_status_code := 409;` đảm bảo triệt tiêu hiện tượng **Overbooking / Double Booking** (bán trùng ghế) ngay cả khi hàng ngàn giao dịch diễn ra đồng thời.

4. **Kiểm Toán CSDL Tự Động (Audit Trail - Bảng NHAT_KY):**
   - Bất kỳ thao tác tạo vé, thanh toán, hủy vé đều được ghi lại tức thì với thông tin: `MaLog`, `BangTacDong`, `HanhDong`, `NguoiThucHien` (`USER`), `ThoiGian`, `NoiDung`.

5. **Ràng Buộc Nghiệp Vụ Bằng Trigger:**
   - Trigger `TRG_CHECK_VE_PHONG` kiểm tra trước khi insert vé: Mã phòng của ghế phải khớp với mã phòng của suất chiếu, ngăn ngừa việc đặt ghế sai phòng từ tầng CSDL.

---

## 3. Hướng Dẫn Chạy Hệ Thống

### Cách 1: Khởi động nhanh (Khuyên dùng trên Windows)
- Nhấp đúp chuột vào file **`start_all.bat`**.
- Hệ thống sẽ tự động bật backend FastAPI (Port 8000), frontend Vite (Port 5173) và mở trình duyệt tại `http://localhost:5173`.

### Cách 2: Khởi động thủ công bằng dòng lệnh

**Bước 1: Khởi động Backend**
```powershell
cd d:\thac\QTCSDLNC\code\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation tự động sinh tại: `http://127.0.0.1:8000/docs`

**Bước 2: Khởi động Frontend**
```powershell
cd d:\thac\QTCSDLNC\code\frontend
npm.cmd run dev
```
Mở giao diện Web tại: `http://localhost:5173`

---

## 4. Kịch Bản Thực Nghiệm Báo Cáo Tiểu Luận (Test Lab)

1. Mở tab **"Test Lab: Tranh Chấp Concurrency"** trên giao diện Web.
2. Chọn một ghế đang ở trạng thái **Trống (Màu xanh)**, ví dụ: Ghế `A1`.
3. Bấm nút **"🚀 Bắt Đầu Thực Nghiệm Tranh Chấp"**:
   - Backend sẽ dùng `ThreadPoolExecutor` mở 2 luồng kết nối độc lập song song vào Oracle cùng gọi `PKG_DATVE.DAT_VE_GIU_CHO`.
   - Giao diện lập tức hiển thị bảng so sánh đối đầu:
     * **Phiên A:** Trả về **HTTP 200** kèm Mã đơn và Mã vé được tạo thành công.
     * **Phiên B:** Bị Oracle chặn với **HTTP 409** kèm thông báo `"Xung đột đồng thời: Ghế vừa được giao dịch bởi một phiên khác!"`.
4. Chuyển sang tab **"Nhật Ký Kiểm Toán (Bảng NHAT_KY)"** để chỉ cho hội đồng thấy bản ghi log mà Oracle vừa tự động ghi nhận vào Tablespace `TS_LOG`.
5. Bấm nút **"Reset Dữ Liệu Demo"** trên thanh Navbar để xóa vé thử nghiệm và lặp lại kịch bản bao nhiêu lần tùy ý.
