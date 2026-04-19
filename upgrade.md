# KẾ HOẠCH NÂNG CẤP HỆ THỐNG GỌI MÓN & THANH TOÁN TẠI BÀN (VERSION 2.0)

## 1. MỤC TIÊU CỐT LÕI
Chuyển đổi mô hình quản lý từ **"Theo Bàn (Table-based)"** sang **"Theo Thực Khách (Guest-based)"**. Cho phép định danh và quản lý đơn hàng độc lập cho nhiều nhóm khách hoặc khách lẻ trên cùng một bàn vật lý, đảm bảo quy trình phục vụ chuyên nghiệp và thanh toán minh bạch.

---

## 2. GIẢI PHÁP CHO CÁC VẤN ĐỀ NGHIỆP VỤ

| Vấn đề | Giải pháp triển khai |
|:---|:---|
| **1. Khách lạ ngồi chung bàn** | Định danh khách hàng qua QR. Mỗi khách là một phiên order độc lập. |
| **2. Gộp nhiều bàn cho khách** | Sử dụng logic Master/Slave, tất cả khách tại cụm bàn gộp trỏ về bàn Master. |
| **3. Gọi chung - Tính riêng (Tách bill)** | Tính năng **"Mở chia hóa đơn"** cho phép tách từ một đơn hàng tổng. |
| **4. Gọi riêng - Tính chung (Gộp bill)** | Nhân viên chọn nhiều khách hàng tại bàn để gộp thành 1 lần thanh toán. |
| **5. Vừa gộp bàn, vừa khách lạ** | Kết hợp Master Table + Guest Name Identification. |

---

## 3. CHI TIẾT CÁC TÍNH NĂNG NÂNG CẤP

### 3.1. Luồng Khách Hàng (User Flow)
- **Định danh Guest (QR Scan)**:
    - Nếu là khách mới: Yêu cầu nhập tên để bắt đầu phiên order.
    - Nếu là khách cũ: Hiển thị **Combobox** danh sách các tên khách cũ (nếu > 1) để khách chọn và tiếp tục order vào phiên cũ.
- **Cấu trúc URL**: `domain.com/menu?table={table_number}/{guest_name}`.
- **Cá nhân hóa**: Mục "Món đã đặt" hiển thị theo từng Guest Name, giúp khách tự theo dõi đơn hàng của mình.

### 3.2. Luồng Nhân Viên (Admin/Staff Dashboard)

#### A. Quản lý Bàn (Table Management)
- **Thêm thông báo cột ghi chú**:
    - Hiển thị thông báo trạng thái: `"Bàn có {n} khách order riêng lẻ"` (với n > 1) ngay tại cột ghi chú của bàn.
- **update nút "Thanh toán"**:
    - Nếu bàn có 1 khách: Chuyển hướng trực tiếp đến trang **Chi tiết đơn hàng**.
    - Nếu bàn có nhiều khách: Hiển thị **Modal/Combobox** để chọn danh sách khách cụ thể cần thanh toán.
- **Xác nhận thanh toán hàng loạt (Bulk Payment)**:
    - Sau khi chọn nhiều khách, hệ thống hỏi: *"Thanh toán cho tất cả đúng không?"*.
    - **Lựa chọn in hóa đơn**:
        - **In riêng**: Truy xuất và in từng hóa đơn lẻ cho từng khách (đã có tên).
        - **In chung**: Gộp tất cả món đã phục vụ của các khách đã chọn thành 1 hóa đơn tổng (không gộp database).

#### B. Quản lý Đơn hàng (Order Management)
Tái định nghĩa giao diện **Chi tiết đơn hàng** với Layout 2 cột (Tỉ lệ 4:6):

- **Cột Trái (4/10) - Danh sách Phiếu đặt (Slips)**:
    - Hiển thị các Slips gọi món được gom nhóm theo thời gian (Timestamp).
    - Trạng thái mặc định: **"Mới"**.
    - Mỗi Slip đi kèm 3 nút thao tác:
        1. **Nhận đơn**: Chuyển trạng thái Slip sang **"Đã nhận đơn"**.
        2. **Đã phục vụ**: Chuyển trạng thái Slip sang **"Đã phục vụ"**. Tại thời điểm này, các món trong Slip sẽ tự động được cộng vào **Phiếu mua hàng tạm tính** ở cột phải.
        3. **Hủy**: Chuyển trạng thái Slip sang **"Đã hủy"**.

- **Cột Phải (6/10) - Phiếu mua hàng tạm tính (Receipt)**:
    - Chỉ hiển thị danh sách các món thực tế từ các Slip có trạng thái **"Đã phục vụ"**.
    - Hiển thị Tổng tiền tạm tính.
    - Hệ thống nút chức năng:
        - **Mở chia hóa đơn**: Để xử lý tách bill nếu khách yêu cầu thêm.
        - **Thanh toán tiền mặt** (chỉ cần nhân viên xác nhận)
        - **Thanh toán thẻ**. (VNPay)
        - **Thanh toán chuyển khoản** (hiển thị qrcode theo đơn hàng - đã có)

---

## 4. PHÂN TÍCH KHUYẾT ĐIỂM & HƯỚNG CẢI THIỆN

---

### 4.1. Hệ thống QR Code & Gọi món (Ordering Flow)

#### 1. Vấn đề bảo mật với QR tĩnh (Static QR)

**Hiện trạng:**
Mã QR trên bàn là đường dẫn tĩnh (ví dụ: `/menu?table=5`). Khách có thể chụp lại mã QR và sử dụng ở ngoài nhà hàng để đặt món, dẫn đến tình trạng phát sinh đơn hàng ảo (ghost orders).

**Giải pháp đề xuất: Xác thực theo phiên bằng mã PIN (Session PIN Verification)**

Thay vì thay đổi QR vật lý, hệ thống sử dụng mã PIN theo từng phiên sử dụng bàn.

**Cơ chế hoạt động:**
- Mỗi bàn khi bắt đầu lượt khách mới sẽ được cấp một mã PIN ngẫu nhiên (4 chữ số).
- Mã PIN hiển thị trên màn hình quản lý của nhân viên (Staff Dashboard).
- Khi khách quét QR, hệ thống yêu cầu nhập mã PIN để truy cập menu.

**Vòng đời mã PIN (PIN Lifecycle):**
- **Kích hoạt:** Khi nhân viên mở bàn hoặc khi trạng thái bàn chuyển từ "Trống" sang "Đang sử dụng".
- **Hết hạn:** Khi thanh toán hoàn tất, bàn trở về trạng thái "Trống" và mã PIN bị hủy.
- Tất cả khách ngồi cùng bàn sử dụng chung một mã PIN để tham gia cùng phiên gọi món.

**Định danh khách hàng (Guest Identification):**
- Sau khi nhập PIN, khách cung cấp **Tên hoặc Số điện thoại**.
- Thông tin này phục vụ cho:
  - Chia bill (Split Bill)
  - Tích điểm khách hàng

**Ưu điểm:**
- Không cần thay đổi hoặc in lại QR code.
- Ngăn chặn hoàn toàn việc đặt món từ xa.
- Giúp nhân viên kiểm soát chính xác khách đang ngồi tại bàn.

---

### 4.2. Toàn vẹn dữ liệu đơn hàng (Data Integrity)

**Các tình huống cần xử lý:**

- **Hai bàn riêng nhưng thanh toán chung:**
  - Nhân viên gộp hóa đơn của nhiều bàn.
  - Sau khi thanh toán, tất cả các bàn liên quan chuyển về trạng thái "Đã thanh toán".

- **Gộp bill sau khi đã chia bill:**
  - Hệ thống cần xóa các bản ghi chia bill trước đó.
  - Khôi phục lại hóa đơn tổng ban đầu.

- **Chia chi phí món dùng chung:**
  - Cho phép phân bổ chi phí món cho một nhóm khách cụ thể.
  - Ví dụ: một chai rượu chỉ chia cho 4 người, không phải toàn bộ bàn.

---

### 4.3. Gộp bàn & Tách bàn (Table Operations)

#### 1. Cải thiện UI/UX khi gộp bàn (Master/Slave)

#### 2. Ngăn chặn gộp bàn lồng nhau (Nested Merging)

**Vấn đề:**
Tránh tình trạng gộp dây chuyền (A → B → C) gây khó khăn khi truy vấn dữ liệu.

**Ràng buộc đề xuất:**
1. Bàn đang là **Slave** không được phép làm Master cho lần gộp khác.
2. Bàn đang là **Master** không được phép làm Slave, trừ khi đã tách gộp trước đó.

#### 3. Chuyển toàn bộ bàn

- Cho phép chuyển toàn bộ dữ liệu sang bàn khác, bao gồm:
  - Hóa đơn
  - Session gọi món
  - Trạng thái bàn 

---

### 4.4. Thanh toán chung nhiều bàn (Multi-table Payment)

#### Vấn đề hiện tại
- Việc gộp bàn vật lý không phải lúc nào cũng cần thiết hoặc phát sinh thanh toán chung cuối giờ khi chưa gộp bàn

#### Giải pháp cải thiện:

- Sử dụng **checkbox** để chọn nhiều bàn cần thanh toán.
- Đặt nút **"Thanh toán chung"** ở góc dưới bên phải (sticky) để dễ thao tác.

#### Màn hình thanh toán tổng hợp (Consolidated View):

- Tự động gộp các món giống nhau từ nhiều bàn thành một dòng.
- Hiển thị thông tin phân bổ theo từng bàn.
- Giúp hóa đơn:
  - Gọn gàng
  - Dễ đọc
  - Chuyên nghiệp hơn

#### Hỗ trợ mở rộng:
- Truy xuất tất cả hóa đơn liên quan đến nhiều bàn.
- Xử lý trường hợp:
  - Một bàn có nhiều khách đặt riêng (nhiều order/session).

---

*(Tài liệu này được cập nhật trạng thái hoàn thành vào ngày 19/04/2026)*
