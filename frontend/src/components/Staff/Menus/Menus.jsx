import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaShoppingCart, FaTable, FaUserPlus, FaList, FaBox, FaChartBar, FaCarrot, FaUser, FaUtensils, FaSignOutAlt } from 'react-icons/fa';

import './menus.scss';

const sliders = [
    {
        url: '/staff',
        icon: <FaHome />,
        name: 'Dashboard',
        role: 'ADMIN'
    },
    {
        url: '/staff/manage',
        icon: <FaUserPlus />,
        name: 'Staff Management',
        role: 'ADMIN'
    },
    {
        url: '/staff/customer',
        icon: <FaUser />,
        name: 'Customers',
    },
    {
        url: '/staff/table',
        icon: <FaTable />,
        name: 'Table Management',
    },
    {
        url: '/staff/category',
        icon: <FaList />,
        name: 'Categories',
        role: 'ADMIN'
    },
    {
        url: '/staff/product',
        icon: <FaBox />,
        name: 'Products',
        role: 'ADMIN'
    },
    {
        url: '/staff/ingredient',
        icon: <FaCarrot />,
        name: 'Ingredients',
        role: 'ADMIN'
    },
    {
        url: '/staff/order',
        icon: <FaShoppingCart />,
        name: 'Orders',
    },
    {
        url: '/staff/revenue',
        icon: <FaChartBar />,
        name: 'Revenue',
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
            <div className="slider__logo d-flex align-items-center justify-content-center py-4 mb-2 border-bottom" style={{ borderColor: 'rgba(197, 160, 89, 0.2)' }}>
                <FaUtensils className="fs-3 me-2" style={{ color: '#c5a059' }} />
                <h4 className="m-0 fw-bold luxury-title" style={{ color: '#c5a059', letterSpacing: '2px' }}>VietNamCusine</h4>
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
                            <span className="slider__menu-name">Logout</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default Menus;