import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import {
    FaBell,
    FaShoppingCart,
    FaExclamationTriangle,
    FaCheckCircle,
    FaExternalLinkAlt,
    FaTrashAlt
} from "react-icons/fa";
import { socket } from "../../../socket";
import { useNavigate } from "react-router-dom";

import "./notification.scss";

function Notification() {
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Lấy thông báo từ localStorage
        const saved = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
        setNotifications(saved);

        // Đồng bộ khi localStorage thay đổi (do Header nhận được thông báo socket hoặc các tab khác)
        const handleStorage = () => {
            const updated = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
            setNotifications(updated);
        };
        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    const handleComplete = (id) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        localStorage.setItem("admin_notifications", JSON.stringify(updated));
        // Kích hoạt sự kiện storage cho chính tab này để Header nhận diện
        window.dispatchEvent(new Event("storage"));
    };

    const handleViewDetail = (orderId) => {
        if (orderId) {
            navigate(`/staff/order/detail/${orderId}`);
        }
    };

    const renderIcon = (type) => {

        switch (type) {

            case "order":
                return <FaShoppingCart className="icon order" />

            case "warning":
                return <FaExclamationTriangle className="icon warning" />

            case "success":
                return <FaCheckCircle className="icon success" />

            default:
                return <FaBell className="icon system" />
        }
    };

    return (
        <div className="admin-notification">

            <Container>

                <div className="notification-header">
                    <FaBell />
                    <h2>Thông báo hệ thống</h2>
                </div>

                <div className="notification-list">
                    {notifications.length > 0 ? (
                        notifications.map((item) => (
                            <div className="notification-item" key={item.id}>
                                <div className="notification-icon">
                                    {renderIcon(item.type || "order")}
                                </div>

                                <div className="notification-content">
                                    <p className="message">
                                        {item.message}
                                    </p>
                                    <span className="time">
                                        {item.time || "Vừa xong"} {item.tableNumber ? `- Bàn ${item.tableNumber}` : ""}
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
                                        className="btn-action complete" 
                                        onClick={() => handleComplete(item.id)}
                                        title="Đánh dấu hoàn thành"
                                    >
                                        <FaTrashAlt /> Hoàn thành
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