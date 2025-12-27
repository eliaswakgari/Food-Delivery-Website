import React, { useEffect, useState } from "react";
import "./Navbar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaMapMarkerAlt, FaBell } from "react-icons/fa";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import { logout } from "../../store/authSlice";
import { upsertNotification, markNotificationRead } from "../../store/notificationSlice";
import { setSearchQuery as setSearchQueryAction, setCategory as setCategoryAction } from "../../store/uiSlice";

const Navbar = () => {
    const dispatch = useDispatch();
    const token = useSelector((state) => state.auth.token);
    const role = useSelector((state) => state.auth.role);
    const user = useSelector((state) => state.auth.user);
    const cartItems = useSelector((state) => state.cart.cartItems) || {};
    const searchQuery = useSelector((state) => state.ui.searchQuery) || "";
    const category = useSelector((state) => state.ui.category) || "All";
    const socket = useSelector((state) => state.socket.socket);
    const allNotifications = useSelector((state) => state.notifications.items) || [];
    const food_list = useSelector((state) => state.food.food_list);

    const [menuOpen, setMenuOpen] = useState(false); // avatar dropdown
    const [mobileNavOpen, setMobileNavOpen] = useState(false); // hamburger menu for small screens
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [userNotifOpen, setUserNotifOpen] = useState(false);

    const adminNotifications = allNotifications.filter((n) => n.role === "admin");
    const userNotifications = allNotifications.filter((n) => n.role === "user");
    const adminUnreadCount = adminNotifications.filter((n) => !n.read).length;
    const userUnreadCount = userNotifications.filter((n) => !n.read).length;
    const adminUnreadNotifications = adminNotifications.filter((n) => !n.read);
    const userUnreadNotifications = userNotifications.filter((n) => !n.read);

    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === "/";

    const handleLogout = async () => {
        try {
            // Ask backend to clear the httpOnly fd_token cookie.
            await axios.post(
                `${API_BASE_URL}/api/user/logout`,
                {},
                {
                    withCredentials: true,
                }
            );
        } catch (err) {
            // Even if backend call fails, fall back to clearing client state.
            console.error("Logout request failed", err);
        }

        dispatch(logout());
        setMenuOpen(false);
        setMobileNavOpen(false);
        navigate("/");
    };

    const handleSettings = () => {
        setMenuOpen(false);
        setMobileNavOpen(false);
        navigate("/settings");
    };

    const avatarUrl = user?.avatar || null;
    const avatarSrc = avatarUrl
        ? avatarUrl.startsWith("http")
            ? avatarUrl
            : avatarUrl.startsWith("/")
                ? `${API_BASE_URL}${avatarUrl}`
                : `${API_BASE_URL}/images/${avatarUrl}`
        : null;
    const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

    const cartCount = cartItems
        ? Object.values(cartItems).reduce((sum, qty) => sum + (qty || 0), 0)
        : 0;

    const categories = React.useMemo(() => {
        const set = new Set();
        const list = Array.isArray(food_list) ? food_list : [];
        list.forEach((item) => {
            if (item.category) set.add(item.category);
        });
        return ["All", ...Array.from(set)];
    }, [food_list]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!isHome) navigate("/");
    };

    // Close mobile nav when route changes
    useEffect(() => {
        setMobileNavOpen(false);
    }, [location.pathname]);

    // Admin socket updates: real-time notifications
    useEffect(() => {
        if (!socket || role !== "admin") return;

        const handleNewOrder = (payload = {}) => {
            const id = payload.orderId || payload._id;
            if (!id) return;

            const title = payload.title || "New order";
            const dateLabel = new Date(payload.date || Date.now()).toLocaleString();

            dispatch(
                upsertNotification({
                    id,
                    role: "admin",
                    title,
                    dateLabel,
                    status: payload.status || "Pending",
                    read: false,
                })
            );
        };

        const handleStatusChanged = ({ orderId, status }) => {
            // When user confirms pickup (Delivered), notify admin explicitly
            if (status === "Delivered" && orderId) {
                const title = `Order #${String(orderId).slice(-6)} picked up`;
                const dateLabel = new Date().toLocaleString();
                dispatch(
                    upsertNotification({
                        id: orderId,
                        role: "admin",
                        title,
                        dateLabel,
                        status,
                        read: false,
                    })
                );
            }
        };

        socket.on("order:new", handleNewOrder);
        socket.on("order:statusChanged", handleStatusChanged);

        return () => {
            socket.off("order:new", handleNewOrder);
            socket.off("order:statusChanged", handleStatusChanged);
        };
    }, [socket, role, dispatch]);

    // User order ready notifications (non-admin customers)
    useEffect(() => {
        const currentUserId = user?._id || user?.id;
        if (!socket || !currentUserId || role === "admin") return;

        const handleUserStatusChanged = ({ userId, orderId, status }) => {
            if (userId !== currentUserId || status !== "Ready") return;

            dispatch(
                upsertNotification({
                    id: orderId,
                    role: "user",
                    title: "Your order is ready",
                    dateLabel: new Date().toLocaleString(),
                    status,
                    read: false,
                })
            );
        };

        socket.on("order:statusChanged", handleUserStatusChanged);
        return () => socket.off("order:statusChanged", handleUserStatusChanged);
    }, [socket, user, role, dispatch]);

    return (
        <nav className={`navbar ${isHome && role !== "admin" ? "navbar-amz" : ""}`}>
            {/* --- Home Amazon UI --- */}
            {role !== "admin" && isHome ? (
                <>
                    <div className="navbar-amz-left">
                        <button className="navbar-amz-logo" onClick={() => navigate("/")}>
                            FOODMART
                        </button>

                        <button className="navbar-amz-delivery">
                            <FaMapMarkerAlt className="navbar-amz-delivery-icon" />
                            <div className="navbar-amz-delivery-text">
                                <span>Deliver to</span>
                                <span>Ethiopia</span>
                            </div>
                        </button>
                    </div>

                    <div className="navbar-amz-search-wrapper">
                        <form className="navbar-amz-search" onSubmit={handleSearchSubmit}>
                            <select
                                className="navbar-amz-search-category"
                                value={category}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    dispatch(setCategoryAction(value));
                                    if (!isHome) navigate("/");
                                }}
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            <input
                                className="navbar-amz-search-input"
                                placeholder="Search food items"
                                value={searchQuery || ""}
                                onChange={(e) => dispatch(setSearchQueryAction(e.target.value))}
                            />

                            <button className="navbar-amz-search-button">Q</button>
                        </form>
                        <button type="button" className="navbar-amz-lang">EN</button>
                    </div>

                    <div className="navbar-amz-right">
                        {!token ? (
                            <button
                                className="navbar-amz-account"
                                onClick={() => navigate("/login")}
                            >
                                <span>Sign in</span>
                                <span>Orders</span>
                            </button>
                        ) : (
                            <div
                                className="navbar-amz-profile-wrapper"
                                onClick={() => setMenuOpen((prev) => !prev)}
                            >
                                <div className="navbar-amz-profile">
                                    {avatarSrc ? (
                                        <img
                                            src={avatarSrc}
                                            alt={user?.name || "Profile"}
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = "";
                                            }}
                                        />
                                    ) : (
                                        <span className="navbar-amz-profile-initials">{initials}</span>
                                    )}
                                </div>

                                {menuOpen && (
                                    <div className="navbar-amz-menu">
                                        <button onClick={handleSettings}>Settings</button>
                                        <button onClick={handleLogout}>Logout</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {token && (
                            <button className="navbar-amz-orders" onClick={() => navigate("/orders")}>
                                <span>My</span>
                                <span>Orders</span>
                            </button>
                        )}

                        <button className="navbar-amz-cart" onClick={() => navigate("/cart")}>
                            <span className="navbar-amz-cart-icon-wrapper">
                                <FaShoppingCart className="navbar-amz-cart-icon" />
                                {cartCount > 0 && (
                                    <span className="navbar-amz-cart-badge">{cartCount}</span>
                                )}
                            </span>
                            <span className="navbar-amz-cart-label">Cart</span>
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="navbar-logo">
                        <Link to="/">Food Delivery</Link>

                        {/* Hamburger for small screens */}
                        <button
                            type="button"
                            className={`navbar-burger ${mobileNavOpen ? "navbar-burger-open" : ""}`}
                            onClick={() => setMobileNavOpen((prev) => !prev)}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>

                    <ul className={`navbar-links ${mobileNavOpen ? "navbar-links-open" : ""}`}>
                        <li><Link to="/">Home</Link></li>

                        {/* USER NAV */}
                        {role !== "admin" && (
                            <>
                                {/* Category dropdown on non-home pages */}
                                <li className="navbar-category">
                                    <select
                                        value={category}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            dispatch(setCategoryAction(value));
                                            if (!isHome) navigate("/");
                                        }}
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </li>

                                {/* Simple search bar on non-home pages */}
                                <li className="navbar-search">
                                    <form onSubmit={handleSearchSubmit}>
                                        <input
                                            type="text"
                                            placeholder="Search food items"
                                            value={searchQuery || ""}
                                            onChange={(e) => dispatch(setSearchQueryAction(e.target.value))}
                                        />
                                    </form>
                                </li>

                                {token && (
                                    <li className="navbar-notifications-wrapper">
                                        <button
                                            className="navbar-icon-button"
                                            onClick={() => setUserNotifOpen((prev) => !prev)}
                                        >
                                            <FaBell />
                                            {userUnreadCount > 0 && (
                                                <span className="navbar-icon-badge">{userUnreadCount > 9 ? "9+" : userUnreadCount}</span>
                                            )}
                                        </button>

                                        {userNotifOpen && (
                                            <div className="navbar-notifications-panel">
                                                <div className="navbar-notifications-header">Notifications</div>

                                                {userUnreadNotifications.length === 0 ? (
                                                    <div className="navbar-notifications-empty">No notifications</div>
                                                ) : (
                                                    userUnreadNotifications.map((n) => (
                                                        <button
                                                            key={n.id}
                                                            className="navbar-notifications-item"
                                                            onClick={() => {
                                                                dispatch(markNotificationRead({ id: n.id, role: "user" }));
                                                                setUserNotifOpen(false);
                                                                navigate(`/orders/${n.id}`);
                                                            }}
                                                        >
                                                            <span>{n.title}</span>
                                                            <span>{n.dateLabel}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </li>
                                )}

                                <li>
                                    <Link to="/cart">
                                        <FaShoppingCart />
                                        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                                    </Link>
                                </li>
                            </>
                        )}

                        {/* ADMIN NAV */}
                        {role === "admin" && (
                            <>
                                <li className="navbar-notifications-wrapper">
                                    <button
                                        className="navbar-icon-button"
                                        onClick={() => setNotificationsOpen((prev) => !prev)}
                                    >
                                        <FaBell />
                                        {adminUnreadCount > 0 && (
                                            <span className="navbar-icon-badge">{adminUnreadCount}</span>
                                        )}
                                    </button>

                                    {notificationsOpen && (
                                        <div className="navbar-notifications-panel">
                                            <div className="navbar-notifications-header">New Orders</div>

                                            {adminUnreadNotifications.length === 0 ? (
                                                <div className="navbar-notifications-empty">No pending orders</div>
                                            ) : (
                                                adminUnreadNotifications.map((n) => (
                                                    <button
                                                        key={n.id}
                                                        className="navbar-notifications-item"
                                                        onClick={() => {
                                                            dispatch(markNotificationRead({ id: n.id, role: "admin" }));
                                                            setNotificationsOpen(false);
                                                            navigate(`/admin?orderId=${n.id}`);
                                                        }}
                                                    >
                                                        <span>{n.title}</span>
                                                        <span>{n.dateLabel}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </li>

                                <li><Link to="/admin">Dashboard</Link></li>
                            </>
                        )}

                        {/* GUEST NAV */}
                        {!token && (
                            <>
                                <li><Link to="/login">Login</Link></li>
                                <li><Link to="/login">Register</Link></li>
                            </>
                        )}

                        {/* AVATAR DROPDOWN */}
                        {token && (
                            <li className="navbar-avatar-wrapper" onClick={() => setMenuOpen(!menuOpen)}>
                                <div className="navbar-avatar">
                                    {avatarSrc ? <img src={avatarSrc} alt="Profile" /> : <span>{initials}</span>}
                                </div>

                                {menuOpen && (
                                    <div className="navbar-menu">
                                        <button onClick={handleSettings}>Settings</button>
                                        <button onClick={handleLogout}>Logout</button>
                                    </div>
                                )}
                            </li>
                        )}
                    </ul>
                </>
            )}
        </nav>
    ); // ← THIS WAS MISSING !!!
};

export default Navbar;
