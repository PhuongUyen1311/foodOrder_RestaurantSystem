# Triển Khai Mạng Lưới Nhắn Tin & Giao Việc Nội Bộ (1-1)

Mục tiêu: Xây dựng tính năng "Bàn giao đơn hàng" hoặc "Nhắn tin nội bộ" cho phép Quản lý chọn đích danh một nhân viên (Staff) đang Online và gửi thông điệp làm việc trực tiếp, thay vì gửi thông báo cho toàn bộ hệ thống.

## ⚠️ User Review Required

> [!IMPORTANT]
> Đây là một tính năng kiến trúc đáng kể yêu cầu cấu hình lại Mạng lưới kết nối (Socket Net). 
> Hiện tại, cơ chế Socket của bạn đang phát **Broadcast** (Thông báo cho tất cả). Để gửi 1-1, chúng ta cần xây dựng cơ sở hạ tầng lấy danh sách Nhân viên đang Online. Bạn vui lòng đọc kỹ phương án dưới đây và phản hồi lại nếu muốn bắt đầu triển khai.

## Đề xuất Giải pháp Kiến trúc: Giao việc & Direct Message (DM)

Tôi đề xuất thiết kế tính năng này dựa trên quy trình **Point-to-Point Socket** kết hợp với **Local Task Board**. Chúng ta sẽ mở rộng mà không cần làm "nặng" thêm Database trừ khi bạn muốn lưu trữ vĩnh viễn tin nhắn chát.

### Phần 1: Backend - Quản lý nhân sự Online (Staff Discovery)
1.  **API `GET /api/admin/online`**: 
    - Truy vấn Collection `Admin` để lấy danh sách các nhân viên có `socket_id ≠ null` (Có nghĩa là họ đang bật tab trang web Dashboard).
    - Dữ liệu trả về: `_id, first_name, last_name, role, avatar`.
2.  **API `POST /api/order/assign-staff`**:
    - Chức năng: Xử lý nội dung tin nhắn và bắn Socket Private.
    - Payload nhận: `targetStaffId`, `orderId`, `message`.
    - Server sẽ tìm `socket_id` của `targetStaffId` và sử dụng hàm gửi độc quyền: 
      `listSocket.updateOrder.to(targetSocketId).emit('privateMessage', payload)`

### Phần 2: Frontend - Giao diện Nhắn tin đích danh
1.  **Nút "📦 Giao Việc / Nhắn Tin" trong `OrderDetail.jsx`**:
    - Khi bấm sẽ mở một Popup Modal (Sử dụng `react-bootstrap`).
    - Trong popup có Dropdown: **"Chọn nhân viên nhận"** (Chỉ hiện những Staff đang có mặt).
    - Có Textbox để Quản lý gõ "Lưu ý: Món này làm nhanh nhé, khách hối" hoặc "Em ra lấy đồ pha chế bàn 4".
    - Bấm Gửi $\to$ Gọi API `assign-staff`.
2.  **Hộp Nhận Tin (Inbox/Notification Box)**:
    - Tại Component `Header.jsx`, chúng ta sẽ gắn thêm lắng nghe sự kiện Socket `privateMessage`.
    - Khi có nhân viên bị "gọi tên", nó sẽ lưu thẳng vào một Local Storage riêng tên là `private_tasks` thay vì `admin_notifications` như cũ.
    - Component `Notification.jsx` sẽ được thiết kế thêm 1 Tab tên là **"Tác vụ của tôi"** mang biểu tượng thư tín. Khi staff xử lý lệnh giao việc xong bấm hoàn thành thì sẽ gạch bỏ tin nhắn.

## Lộ trình triển khai (Các tệp sẽ bị thay đổi)

- Hỗ trợ API: `backend/app/controllers/order.controller.js` & `route`.
- Giao diện giao việc: `frontend/src/pages/Staff/Order/OrderDetail.jsx`.
- Nhận thông báo cá nhân: `frontend/src/components/Staff/Header/Header.jsx`.
- Nơi xử lý Tasks riêng: `frontend/src/pages/Staff/Notification/Notification.jsx`.

## Open Questions

> [!WARNING]  
> Xin bạn cho ý kiến về 1 câu hỏi quan trọng để quyết định mức độ phức tạp:
> Bạn có muốn **Lưu trữ vĩnh viễn** các tin nhắn chat nội bộ này vào trong Database (Ví dụ: để đối soát xem hôm đó Quản lý giao việc cho ai vào giờ nào không)? 
> Hay bạn chỉ cần nó như **Lời nhắc nhở tạm thời (Ephemeral)** (Nếu nhân viên f5 reload xóa cache máy hay qua ngày mai thì đoạn chat gán việc tự bay mất y như Notification hiện nay)?
