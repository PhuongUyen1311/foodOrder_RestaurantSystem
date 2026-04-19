import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import {
    FaBell,
    FaShoppingCart,
    FaExclamationTriangle,
    FaCheckCircle,
    FaExternalLinkAlt,
    FaTrashAlt,
    FaShareAlt,
    FaMoneyBillWave
} from "react-icons/fa";
import { socket } from "../../../socket";
import { useNavigate } from "react-router-dom";

import "./notification.scss";

function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("all"); // all, order, support
    const navigate = useNavigate();

    useEffect(() => {
        // Lấy thông báo từ localStorage
        const saved = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
        setNotifications(saved);

        const handleStorage = () => {
            const updated = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
            setNotifications(updated);
        };

        const handleNotificationsUpdated = (e) => {
            if (e.detail) {
                setNotifications(e.detail);
            } else {
                handleStorage();
            }
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener("adminNotificationsUpdated", handleNotificationsUpdated);

        return () => {
            // Đánh dấu tất cả là đã đọc KHI RỜI KHỎI TRANG (cleanup)
            const currentNotifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
            const markedAsRead = currentNotifications.map(n => ({ ...n, isRead: true }));
            localStorage.setItem("admin_notifications", JSON.stringify(markedAsRead));
            
            // Cập nhật badge ở Header
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new CustomEvent("adminNotificationsUpdated", { detail: markedAsRead }));

            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("adminNotificationsUpdated", handleNotificationsUpdated);
        };
    }, []);

    const handleComplete = (id) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        localStorage.setItem("admin_notifications", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
    };

    const handleViewDetail = (orderId) => {
        if (orderId) {
            navigate(`/staff/order/detail/${orderId}`);
        }
    };

    const handleShare = (item) => {
        const content = `[THÔNG BÁO] ${item.message} ${item.tableNumber ? `(Bàn ${item.tableNumber})` : ""}`;
        const event = new CustomEvent('shareContentToChat', { detail: content });
        window.dispatchEvent(event);
    };

    const renderIcon = (type) => {
        switch (type) {
            case "order": return <FaShoppingCart className="icon order" />
            case "payment": return <FaMoneyBillWave className="icon success" />
            case "support": return <FaExclamationTriangle className="icon warning" />
            case "success": return <FaCheckCircle className="icon success" />
            default: return <FaBell className="icon system" />
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === "all") return true;
        if (filter === "order") return n.type === "order";
        if (filter === "payment") return n.type === "payment";
        if (filter === "support") return n.type === "support";
        return true;
    });

    const sortedNotifications = [...filteredNotifications].sort((a, b) => {
        const isAServed = a.status === 'SERVED' || a.status === 'COMPLETED';
        const isBServed = b.status === 'SERVED' || b.status === 'COMPLETED';

        // Chỉ đẩy thông báo loại 'order' đã phục vụ xuống cuối
        // Các loại khác (payment, support) giữ nguyên vị trí theo thời gian
        if (a.type === 'order' && b.type === 'order') {
            if (isAServed && !isBServed) return 1;
            if (!isAServed && isBServed) return -1;
        } else if (a.type === 'order' && isAServed) {
            return 1;
        } else if (b.type === 'order' && isBServed) {
            return -1;
        }
        
        // Đơn mới nhất (createdAt mới nhất) nằm ở đầu tiên
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
        return timeB - timeA;
    });

    return (
        <div className="admin-notification">
            <Container>
                <div className="notification-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <FaBell className="me-2 fs-3 text-primary" />
                        <h2 className="mb-0">Thông báo hệ thống</h2>
                    </div>
                    <div className="notification-filters d-flex gap-2">
                        <button className={`btn-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả</button>
                        <button className={`btn-filter ${filter === 'order' ? 'active' : ''}`} onClick={() => setFilter('order')}>Đơn hàng</button>
                        <button className={`btn-filter ${filter === 'payment' ? 'active' : ''}`} onClick={() => setFilter('payment')}>Thanh toán</button>
                        <button className={`btn-filter ${filter === 'support' ? 'active' : ''}`} onClick={() => setFilter('support')}>Yêu cầu hỗ trợ</button>
                    </div>
                </div>

                <div className="notification-list mt-4">
                    {sortedNotifications.length > 0 ? (
                        sortedNotifications.map((item) => (
                            <div className={`notification-item ${item.status === 'SERVED' || item.status === 'COMPLETED' ? 'served-item' : ''} ${item.isRead ? 'read-item' : ''}`} key={item.id}>
                                <div className="notification-icon">
                                    {renderIcon(item.type || "order")}
                                </div>

                                <div className="notification-content">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <p className="message mb-0 fw-bold">
                                            {item.message}
                                        </p>
                                        {item.status && (
                                            <span className={`status-badge ${item.status.toLowerCase()}`}>
                                                {item.status === 'NEW' ? 'Đơn mới' : 
                                                 item.status === 'SERVED' ? 'Đã phục vụ' : 
                                                 item.status === 'COMPLETED' ? 'Đã thanh toán' :
                                                 item.status === 'SERVING' ? 'Đang phục vụ' : 
                                                 item.status === 'CONFIRMED' ? 'Đã nhận đơn' : 'Đang xử lý'}
                                            </span>
                                        )}
                                    </div>
                                    <span className="time">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN') : item.time || "Vừa xong"} 
                                        {item.tableNumber ? ` - Bàn ${item.tableNumber}` : ""}
                                        {item.guestName ? ` - ${item.guestName}` : ""}
                                        {item.batchNum ? ` - lần ${item.batchNum}` : ""}
                                    </span>
                                </div>

                                <div className="notification-actions">
                                    {item.orderId && (
                                        <button 
                                            className="btn-action view" 
                                            onClick={() => handleViewDetail(item.orderId)}
                                            title="Xem chi tiết đơn hàng"
                                        >
                                            <FaExternalLinkAlt /> Xem đơn
                                        </button>
                                    )}
                                    <button 
                                        className="btn-action share" 
                                        onClick={() => handleShare(item)}
                                        title="Chia sẻ lên Messenger"
                                    >
                                        <FaShareAlt /> Chia sẻ
                                    </button>
                                    <button 
                                        className="btn-action complete" 
                                        onClick={() => handleComplete(item.id)}
                                        title="Đánh dấu hoàn thành"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5 text-muted bg-white rounded shadow-sm">
                            <FaBell className="fs-1 mb-3 opacity-25" />
                            <p className="mb-0">Không có thông báo mới nào.</p>
                        </div>
                    )}
                </div>
            </Container>
        </div>
    );
}

export default Notification;