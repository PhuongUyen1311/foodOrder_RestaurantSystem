import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { socket } from "../../../socket";
import {
    FaSearch,
    FaBell,
    FaUserAlt,
    FaCircle,
    FaFacebookMessenger
} from "react-icons/fa";
import { toast } from 'react-toastify';
import "./header.scss";

function Header() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const location = useLocation();
    const [openProfile, setOpenProfile] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);

    // Hàm phát âm thanh thông báo
    const playNotificationSound = () => {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(e => console.log("Audio play failed:", e));
    };

    useEffect(() => {
        // Cập nhật socket cho nhân viên
        if (user && (user.id || user._id)) {
            socket.emit("adminConnect", user.id || user._id);
        }

        // Lấy thông báo từ localStorage khi khởi tạo
        const savedNotifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
        setNotifications(savedNotifications);

        const handleUnreadUpdate = (e) => {
            setUnreadMessages(e.detail || 0);
        };
        window.addEventListener('unreadUpdate', handleUnreadUpdate);

        // Lắng nghe sự kiện thông báo mới từ socket
        socket.on("notification", (data) => {
            playNotificationSound();
            
            // Hiển thị Toast thông báo nhanh
            const toastMessage = data.message || "Có thông báo mới từ hệ thống!";
            if (data.type === 'support') {
                toast.warning(toastMessage);
            } else {
                toast.info(toastMessage);
            }
            
            setNotifications(prev => {
                const newList = [{ ...data, id: Date.now(), isRead: false }, ...prev];
                localStorage.setItem("admin_notifications", JSON.stringify(newList));
                // Thông báo cho các tab khác hoặc chính tab này về sự thay đổi
                window.dispatchEvent(new Event("storage"));
                window.dispatchEvent(new CustomEvent("adminNotificationsUpdated", { detail: newList }));
                return newList;
            });
        });

        // Lắng nghe cập nhật trạng thái đợt gọi món
        socket.on("batchStatusUpdated", (data) => {
            const { orderId, batchNum, status } = data;
            setNotifications(prev => {
                const updated = prev.map(n => {
                    if (n.orderId === orderId && n.batchNum === batchNum) {
                        return { ...n, status: status };
                    }
                    return n;
                });
                localStorage.setItem("admin_notifications", JSON.stringify(updated));
                window.dispatchEvent(new Event("storage"));
                return updated;
            });
        });

        // Lắng nghe sự kiện thay đổi localStorage từ các tab khác
        const handleStorageChange = () => {
            const updated = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
            setNotifications(updated);
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            socket.off("notification");
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener('unreadUpdate', handleUnreadUpdate);
        };
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("accessToken");
        window.location.href = "/staff";
    };

    const timeoutRef = useRef(null);
    const handleMouseEnter = () => {
        clearTimeout(timeoutRef.current);
        setOpenProfile(true);
    };
    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setOpenProfile(false);
        }, 200);
    };

    return (
        <div className="header-staff">
            <div className="header-left">
                <div className="header-search">
                    <FaSearch className="search-icon" />
                    <input type="text" placeholder="Tìm kiếm..." />
                </div>
            </div>

            <div className="header-right">
                <Link
                    to="/staff/notification"
                    className={`header-icon ${location.pathname === "/staff/notification" ? "active" : ""}`}
                >
                    <FaBell />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="notification-badge">{notifications.filter(n => !n.isRead).length}</span>
                    )}
                </Link>
                
                <div 
                    className="header-icon"
                    onClick={() => window.dispatchEvent(new Event('toggleMessenger'))}
                    style={{ cursor: 'pointer' }}
                >
                    <FaFacebookMessenger />
                    {unreadMessages > 0 && (
                        <span className="notification-badge messenger">{unreadMessages}</span>
                    )}
                </div>

                <div
                    className="header-avatar"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <FaUserAlt />
                    {openProfile && (
                        <div className="profile-dropdown">
                            <div className="profile-name">
                                {user?.firstName || user?.first_name}
                            </div>
                            <Link to="/staff/profile" className="dropdown-item">Hồ sơ cá nhân</Link>
                            <div className="dropdown-item logout" onClick={handleLogout}>Đăng xuất</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Header;