import React, { useEffect, useState } from "react";
import "./Navbar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaBell, FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import { logout, setCredentials } from "../../store/authSlice";
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
    const food_list = useSelector((state) => state.food.food_list) || [];

    const [menuOpen, setMenuOpen] = useState(false); // avatar dropdown
    const [mobileNavOpen, setMobileNavOpen] = useState(false); // hamburger menu for small screens
    const [pendingCount, setPendingCount] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [userNotifOpen, setUserNotifOpen] = useState(false);

    const adminNotifications = allNotifications.filter((n) => n.role === "admin");
    const userNotifications = allNotifications.filter((n) => n.role === "user");
    const adminUnreadCount = adminNotifications.filter((n) => !n.read).length;
    const userUnreadCount = userNotifications.filter((n) => !n.read).length;

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
    const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

    const cartCount = cartItems
        ? Object.values(cartItems).reduce((sum, qty) => sum + (qty || 0), 0)
        : 0;

    const categories = React.useMemo(() => {
        const set = new Set();
        food_list?.forEach((item) => {
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

    // Fetch pending orders count for admin (badge on bell)
    useEffect(() => {
        const fetchPending = async () => {
            if (!token || role !== "admin") return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/order/admin-list`, {
                    // Use fd_token cookie for auth
                    withCredentials: true,
                });

                if (res.data?.success && Array.isArray(res.data.data)) {
                    const pendingOrders = res.data.data.filter(
                        (o) => (o.status || "Pending") === "Pending"
                    );

                    setPendingCount(pendingOrders.length);
                }
            } catch (err) {
                console.error("Navbar fetch error:", err);
            }
        };

        fetchPending();
        const id = setInterval(fetchPending, 30000);
        return () => clearInterval(id);
    }, [token, role]);

    // Admin socket updates: real-time pending counter + notifications
    useEffect(() => {
        if (!socket || role !== "admin") return;

        const handleNewOrder = (payload = {}) => {
            setPendingCount((prev) => prev + 1);

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
            setPendingCount((prev) => {
                if (status === "Pending") return prev + 1;
                if (["Preparing", "Ready", "Delivered"].includes(status)) {
                    return prev > 0 ? prev - 1 : 0;
                }
                return prev;
            });

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
    }, [socket, role]);

    // User order ready notifications (non-admin customers)
    useEffect(() => {
        if (!socket || !user?._id || role === "admin") return;

        const handleUserStatusChanged = ({ userId, orderId, status }) => {
            if (userId !== user._id || status !== "Ready") return;

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

                        <button
                            className="navbar-amz-account"
                            onClick={() => navigate(token ? "/settings" : "/login")}
                        >
                            <span>{token ? `Hello, ${user?.name?.split(" ")[0]}` : "Hello, sign in"}</span>
                            <span>Account & Lists</span>
                        </button>

                        {token && (
                            <button className="navbar-amz-orders" onClick={() => navigate("/orders")}>
                                <span>My</span>
                                <span>Orders</span>
                            </button>
                        )}

                        {token && (
                            <div className="navbar-notifications-wrapper">
                                <button
                                    className="navbar-icon-button"
                                    onClick={() => setUserNotifOpen((prev) => !prev)}
                                >
                                    <FaBell />
                                    {userUnreadCount > 0 && (
                                        <span className="navbar-icon-badge">userUnreadCount</span>
                                    )}
                                </button>

                                {userNotifOpen && (
                                    <div className="navbar-notifications-panel">
                                        <div className="navbar-notifications-header">Notifications</div>

                                        {userNotifications.length === 0 ? (
                                            <div className="navbar-notifications-empty">No new notifications</div>
                                        ) : (
                                            userNotifications.map((n) => (
                                                <button
                                                    key={n.id}
                                                    className="navbar-notifications-item"
                                                    onClick={() => {
                                                        setUserNotifOpen(false);
                                                        navigate("/orders");
                                                    }}
                                                >
                                                    <span>{n.title}</span>
                                                    <span>{n.dateLabel}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
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
                                            {userNotifications.length > 0 && (
                                                <span className="navbar-icon-badge">{userNotifications.length}</span>
                                            )}
                                        </button>

                                        {userNotifOpen && (
                                            <div className="navbar-notifications-panel">
                                                <div className="navbar-notifications-header">Notifications</div>

                                                {userNotifications.length === 0 ? (
                                                    <div className="navbar-notifications-empty">No notifications</div>
                                                ) : (
                                                    globalNotifications.notifications.map((n) => (
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
                                        {(adminUnreadCount > 0 || pendingCount > 0) && (
                                            <span className="navbar-icon-badge">{adminUnreadCount || pendingCount}</span>
                                        )}
                                    </button>

                                    {notificationsOpen && (
                                        <div className="navbar-notifications-panel">
                                            <div className="navbar-notifications-header">New Orders</div>

                                            {adminNotifications.length === 0 ? (
                                                <div className="navbar-notifications-empty">No pending orders</div>
                                            ) : (
                                                adminNotifications.map((n) => (
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
                                    {avatarUrl ? <img src={avatarUrl} alt="Profile" /> : <span>{initials}</span>}
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
