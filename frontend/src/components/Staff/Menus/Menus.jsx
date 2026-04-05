import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaShoppingCart, FaTable, FaUserPlus, FaList, FaBox, FaChartBar, FaCarrot, FaUser, FaUtensils, FaSignOutAlt } from 'react-icons/fa';

import './menus.scss';

const sliders = [
    {
        url: '/staff',
        icon: <FaHome />,
        name: 'Trang chủ',
        role: 'ADMIN'
    },
    {
        url: '/staff/manage',
        icon: <FaUserPlus />,
        name: 'Nhân viên',
        role: 'ADMIN'
    },
    {
        url: '/staff/customer',
        icon: <FaUser />,
        name: 'Khách hàng',
    },
    {
        url: '/staff/table',
        icon: <FaTable />,
        name: 'Quản lý bàn',
    },
    {
        url: '/staff/category',
        icon: <FaList />,
        name: 'Danh mục',
        role: 'ADMIN'
    },
    {
        url: '/staff/product',
        icon: <FaBox />,
        name: 'Sản phẩm',
        role: 'ADMIN'
    },
    {
        url: '/staff/ingredient',
        icon: <FaCarrot />,
        name: 'Nguyên liệu',
        role: 'ADMIN'
    },
    {
        url: '/staff/order',
        icon: <FaShoppingCart />,
        name: 'Đơn hàng',
    },
    {
        url: '/staff/revenue',
        icon: <FaChartBar />,
        name: 'Doanh thu',
        role: 'ADMIN'
    },
];

function Menus() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    let roleUser = user ? user.role : null;
    const location = useLocation();

    const handleLogout = () => {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("user");
    };

    return (
        <div className="slider__menu d-flex flex-column">
            <div className="slider__logo d-flex align-items-center justify-content-center py-2 mb-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                <FaUtensils className="fs-3 me-2" style={{ color: '#1a4824ff', fontSize: '15px' }} />
                <h4 className="m-0 fw-bold" style={{ color: '#1a4824ff', marginBottom: '20px' }}>HEATHYFOOD</h4>
            </div>

            <div className="flex-grow-1" style={{ overflowY: 'auto', scrollbarWidth: 'none' }}>
                <ul className="slider__menu-list">
                    {sliders.map((item, index) => {
                        const { url, icon, name, role } = item;
                        if (role && role !== roleUser) return null;
                        const isActive = location.pathname === url;

                        return (
                            <li
                                className={`slider__menu-item ${isActive ? 'active' : ''}`}
                                key={index}
                            >
                                <Link
                                    to={url}
                                    className={`slider__menu-link ${role && role !== roleUser ? 'disable' : ''}`}
                                >
                                    {icon}
                                    <span className="slider__menu-name">{name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div className="slider__logout mt-auto" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                <ul className="slider__menu-list m-0 py-3">
                    <li className="slider__menu-item">
                        <Link
                            to="/staff/login"
                            className="slider__menu-link text-danger"
                            onClick={handleLogout}
                        >
                            <FaSignOutAlt className="text-danger" />
                            <span className="slider__menu-name">Đăng xuất</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default Menus;