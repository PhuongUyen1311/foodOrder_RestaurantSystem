import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
    FaSearch,
    FaBell,
    FaUserAlt,
    FaUser,
    FaRunning,
    FaHome
} from "react-icons/fa";

import "./header.scss";

function Header() {

    const user = JSON.parse(sessionStorage.getItem("user"));
    const location = useLocation();

    const [openProfile, setOpenProfile] = useState(false);

    const handleLogout = () => {

        sessionStorage.removeItem("user");
        sessionStorage.removeItem("accessToken");

        window.location.href = "/staff";
    };

    return (

        <div className="header-staff">

            {/* LEFT */}
            <div className="header-left">

                <div className="header-search">

                    <FaSearch className="search-icon" />

                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                    />

                </div>

            </div>

            {/* RIGHT */}
            <div className="header-right">

                {/* NOTIFICATION */}
                <Link
                    to="/staff/notification"
                    className={`header-icon ${location.pathname === "/staff/notification" ? "active" : ""}`}
                >
                    <FaBell />
                </Link>

                {/* PROFILE */}
                <div
                    className="header-avatar"
                    onClick={() => setOpenProfile(!openProfile)}
                >

                    <FaUserAlt />

                    {openProfile && (

                        <div className="profile-dropdown">

                            <div className="profile-name">
                                {user?.firstName} {user?.lastName}
                            </div>

                            <Link
                                to="/staff/profile"
                                className="dropdown-item"
                            >
                                <FaUser />
                                Hồ sơ cá nhân
                            </Link>

                            <div
                                className="dropdown-item logout"
                                onClick={handleLogout}
                            >
                                <FaRunning />
                                Đăng xuất
                            </div>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default Header;