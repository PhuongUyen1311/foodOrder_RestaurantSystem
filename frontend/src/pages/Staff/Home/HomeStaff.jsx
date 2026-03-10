import React from 'react';

import './homeStaff.scss';

function Staff(props) {
    return (
        <div>
            <h2>Thống kê</h2>
            <ul>
                <li>Tổng số sản phẩm: </li>
                <li>Tổng số khách hàng: </li>
                <li>Tổng số đơn hàng: </li>
                <li>Doanh thu hôm nay / tháng: </li>
            </ul>
            <h2>Các biểu đồ</h2>
            <h2>Đơn hàng gần đây</h2>
            <ul>
                <li>Đơn hàng #12345 - Khách hàng: John Doe - Tổng tiền: $100 - Trạng thái: Đang xử lý</li>
                <li>Đơn hàng #12346 - Khách hàng: Jane Smith - Tổng tiền: $150 - Trạng thái: Đã giao</li>
                <li>Đơn hàng #12347 - Khách hàng: Bob Johnson - Tổng tiền: $200 - Trạng thái: Đang xử lý</li>   
            </ul>
            <h2>Thông báo quan trọng</h2>
            <ul>
                <li>Hệ thống sẽ bảo trì vào ngày 30/06/2024 từ 00:00 đến 06:00.</li>
                <li>Đơn hàng đang chờ xử lý</li>
                <li>Sản phẩm 1 sắp hết hàng</li>
            </ul>
        </div>
    );
}

export default Staff;