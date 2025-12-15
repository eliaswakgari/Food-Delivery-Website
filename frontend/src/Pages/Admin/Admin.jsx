import React, { useEffect, useState } from "react";
import "./Admin.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { MdDashboard, MdAddCircleOutline, MdListAlt, MdReceiptLong, MdInsights, MdMenu, MdMenuOpen, MdPerson, MdNotificationsNone } from "react-icons/md";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import { fetchFood, setFoodList } from "../../store/foodSlice";
import { logout } from "../../store/authSlice";
import { upsertNotification, markNotificationRead } from "../../store/notificationSlice";

const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId: notifOrderIdParam } = useParams();
  const [active, setActive] = useState("dashboard");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const food_list = useSelector((state) => state.food.food_list) || [];
  const allNotifications = useSelector((state) => state.notifications.items) || [];
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState("unread"); // all | unread | read
  const [selectedNotifOrder, setSelectedNotifOrder] = useState(null);
  const [headerNotifOpen, setHeaderNotifOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: null,
  });
  const [addStatus, setAddStatus] = useState("");
  const [orderFilter, setOrderFilter] = useState("all"); // all | today | week | month | year

  const adminUnreadCount = allNotifications.filter(
    (n) => n.role === "admin" && !n.read
  ).length;

  const adminUnreadNotifications = allNotifications.filter(
    (n) => n.role === "admin" && !n.read
  );

  // When navigated with ?orderId=... from navbar notification, focus Orders tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");
    if (!orderId) return;

    setActive("orders");
    setHighlightedOrderId(orderId);

    const timeout = setTimeout(() => {
      setHighlightedOrderId(null);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [location.search]);

  // When visiting /admin/notifications/:orderId directly, focus Notifications detail view
  useEffect(() => {
    if (!notifOrderIdParam) return;
    setActive("notifications");
    if (!orders || orders.length === 0) return;
    const match = orders.find((o) => o._id === notifOrderIdParam);
    if (match) {
      setSelectedNotifOrder(match);
    }
  }, [notifOrderIdParam, orders]);

  // Helper to focus a specific order inside the Orders tab from within Admin
  const focusOrderRow = (orderId) => {
    if (!orderId) return;
    setActive("orders");
    setHighlightedOrderId(orderId);

    // Clear highlight after a short delay so the UI returns to normal
    setTimeout(() => {
      setHighlightedOrderId((current) => (current === orderId ? null : current));
    }, 4000);
  };

  const categories = React.useMemo(() => {
    // Most common restaurant categories (curated, max ~13)
    const base = [
      "Pizza",
      "Burger",
      "Pasta",
      "Chicken",
      "Seafood",
      "Sandwich",
      "Salad",
      "Dessert",
      "Drinks",
      "Breakfast",
      "Vegan",
      "BBQ",
      "Other",
    ];

    const set = new Set(base);

    // Also include any extra categories that already exist in the database
    food_list.forEach((item) => {
      if (item && item.category) {
        set.add(item.category);
      }
    });

    return Array.from(set);
  }, [food_list]);

  useEffect(() => {
    if (!addForm.category && categories.length > 0) {
      setAddForm((prev) => ({ ...prev, category: categories[0] }));
    }
  }, [categories, addForm.category]);

  // Ensure admin has food data even if Home page not visited
  useEffect(() => {
    if (!food_list || food_list.length === 0) {
      dispatch(fetchFood());
    }
  }, [dispatch, food_list && food_list.length]);

  // Refetch food list from backend (for auto-refresh after add/delete)
  const refreshFoodList = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/food/list`);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        dispatch(setFoodList(res.data.data));
      }
    } catch (err) {
      console.error("Failed to refresh food list", err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setAvatarMenuOpen(false);
    navigate("/login");
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;

    try {
      const res = await axios.delete(`${API_BASE_URL}/api/order/admin-order/${id}`, {
        // Use fd_token cookie for auth
        withCredentials: true,
      });

      if (!res.data || !res.data.success) {
        alert(res.data?.message || "Failed to delete order.");
      } else {
        alert("Order deleted.");
        setOrders((prev) => prev.filter((o) => o._id !== id));
      }
    } catch (err) {
      console.error("Error deleting order", err);
      alert("Server error while deleting order.");
    }
  };

  const handleAddChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files[0]) {
      setAddForm((prev) => ({ ...prev, image: files[0] }));
    } else {
      setAddForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Fetch admin orders when Orders or Analytics tab becomes active
  useEffect(() => {
    const fetchOrders = async () => {
      if (!["orders", "analytics", "dashboard"].includes(active)) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/order/admin-list`, {
          // Use fd_token cookie for auth
          withCredentials: true,
        });
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    };

    fetchOrders();
  }, [active]);

  // Seed admin notifications from existing orders so Notifications tab
  // is not empty after a full page reload.
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    orders.slice(0, 50).forEach((o) => {
      const firstItem = o.items && o.items.length > 0 ? o.items[0] : null;
      const titleBase = firstItem ? firstItem.name : "Order";
      const title = `${titleBase} • #${String(o._id).slice(-6)}`;
      const dateLabel = new Date(o.date || o.createdAt || Date.now()).toLocaleString();

      dispatch(
        upsertNotification({
          id: o._id,
          role: "admin",
          title,
          dateLabel,
          status: o.status || "Pending",
          // Do not force read/unread state here; keep existing flag if present.
        })
      );
    });
  }, [orders, dispatch]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddStatus("");

    try {
      const formData = new FormData();
      formData.append("name", addForm.name);
      formData.append("description", addForm.description);
      formData.append("price", addForm.price);
      formData.append("category", addForm.category);
      if (addForm.image) {
        formData.append("image", addForm.image);
      }

      const res = await axios.post(`${API_BASE_URL}/api/food/add`, formData, {
        // Use fd_token cookie for auth
        withCredentials: true,
      });

      if (res.data && res.data.success) {
        setAddStatus("Food added successfully.");
        setAddForm({ name: "", description: "", price: "", category: "", image: null });
        await refreshFoodList();
      } else {
        setAddStatus(res.data.message || "Failed to add food.");
      }
    } catch (err) {
      console.error("Error adding food", err);
      setAddStatus("Server error while adding food.");
    }
  };

  const handleDeleteFood = async (id) => {
    if (!window.confirm("Delete this food item?")) return;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/food/remove`,
        { id },
        {
          // Use fd_token cookie for auth
          withCredentials: true,
        }
      );

      if (!res.data || !res.data.success) {
        alert(res.data?.message || "Failed to delete food.");
      } else {
        alert("Food deleted.");
        await refreshFoodList();
      }
    } catch (err) {
      console.error("Error deleting food", err);
      alert("Server error while deleting food.");
    }
  };

  const renderContent = () => {
    const applyOrderFilter = (list) => {
      if (!list || list.length === 0) return [];

      const now = new Date();

      const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      const startOfWeek = () => {
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
        return new Date(d.setDate(diff));
      };

      const startOfMonth = () => new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = () => new Date(now.getFullYear(), 0, 1);

      return list.filter((o) => {
        const d = new Date(o.date || o.createdAt || now);
        if (orderFilter === "today") {
          return isSameDay(d, now);
        }
        if (orderFilter === "week") {
          return d >= startOfWeek();
        }
        if (orderFilter === "month") {
          return d >= startOfMonth();
        }
        if (orderFilter === "year") {
          return d >= startOfYear();
        }
        return true;
      });
    };

    if (active === "dashboard") {
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const pendingCount = orders.filter((o) => (o.status || "Pending") === "Pending").length;
      const today = new Date();
      const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      const ordersToday = orders.filter((o) => {
        const d = new Date(o.date || o.createdAt || today);
        return isSameDay(d, today);
      }).length;

      const recentOrders = [...orders]
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
        .slice(0, 5);

      return (
        <>
          <h1>Admin Dashboard</h1>
          <div className="admin-dashboard-subtitle">Today&apos;s snapshot of your restaurant performance</div>
          <div className="admin-dashboard-stats">
            <div className="admin-dashboard-card">
              <p className="admin-dashboard-label">Orders today</p>
              <p className="admin-dashboard-value">{ordersToday}</p>
              <p className="admin-dashboard-help">Number of new orders placed today</p>
            </div>
            <div className="admin-dashboard-card">
              <p className="admin-dashboard-label">Total orders</p>
              <p className="admin-dashboard-value">{totalOrders}</p>
              <p className="admin-dashboard-help">All-time orders in the system</p>
            </div>
            <div className="admin-dashboard-card">
              <p className="admin-dashboard-label">Revenue ($)</p>
              <p className="admin-dashboard-value">{totalRevenue.toFixed(2)}</p>
              <p className="admin-dashboard-help">Total amount collected from paid orders</p>
            </div>
            <div className="admin-dashboard-card">
              <p className="admin-dashboard-label">Pending orders</p>
              <p className="admin-dashboard-value">{pendingCount}</p>
              <p className="admin-dashboard-help">Orders that still need attention</p>
            </div>
          </div>

          <section className="admin-dashboard-recent">
            <div className="admin-dashboard-recent-header">
              <h2>Recent activity</h2>
              <span>Last {recentOrders.length} orders</span>
            </div>
            {recentOrders.length === 0 ? (
              <p className="admin-dashboard-recent-empty">No orders yet. New orders will appear here.</p>
            ) : (
              <ul className="admin-dashboard-recent-list">
                {recentOrders.map((o) => {
                  const firstItem = o.items && o.items.length > 0 ? o.items[0] : null;
                  const dateLabel = new Date(o.date || o.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <li key={o._id} className="admin-dashboard-recent-item">
                      <div className="admin-dashboard-recent-main">
                        <span className="admin-dashboard-recent-title">{firstItem ? firstItem.name : "Order"}</span>
                        <span className={`admin-dashboard-status-pill status-${(o.status || "Pending").toLowerCase()}`}>
                          {o.status || "Pending"}
                        </span>
                      </div>
                      <div className="admin-dashboard-recent-meta">
                        <span>{dateLabel}</span>
                        <span>
                          ${o.amount || 0} • {o.payment ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      );
    }

    if (active === "add") {
      return (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h1>Add Items</h1>
            <form className="admin-add-form" onSubmit={handleAddSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={addForm.name}
                onChange={handleAddChange}
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                value={addForm.description}
                onChange={handleAddChange}
                required
              />
              <input
                type="number"
                step="0.01"
                name="price"
                placeholder="Price"
                value={addForm.price}
                onChange={handleAddChange}
                required
              />
              <select
                name="category"
                value={addForm.category}
                onChange={handleAddChange}
                required
              >
                {categories.length === 0 ? (
                  <option value="">No categories yet</option>
                ) : (
                  categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))
                )}
              </select>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleAddChange}
                required
              />
              {addStatus && <p className="admin-status">{addStatus}</p>}
              <button type="submit">Save Food</button>
            </form>
          </div>
        </div>
      );
    }

    if (active === "list") {
      return (
        <>
          <h1>List Items</h1>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {food_list && food_list.length > 0 ? (
                  food_list.map((item) => (
                    <tr key={item._id}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.price}</td>
                      <td>
                        <button onClick={() => handleDeleteFood(item._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No items found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    if (active === "orders") {
      const filteredOrders = applyOrderFilter(orders);

      return (
        <>
          <h1>Orders</h1>
          <div className="admin-filter-bar">
            <button
              className={`admin-filter-btn ${orderFilter === "all" ? "admin-filter-active" : ""}`}
              onClick={() => setOrderFilter("all")}
            >
              All
            </button>
            <button
              className={`admin-filter-btn ${orderFilter === "today" ? "admin-filter-active" : ""}`}
              onClick={() => setOrderFilter("today")}
            >
              Today
            </button>
            <button
              className={`admin-filter-btn ${orderFilter === "week" ? "admin-filter-active" : ""}`}
              onClick={() => setOrderFilter("week")}
            >
              This Week
            </button>
            <button
              className={`admin-filter-btn ${orderFilter === "month" ? "admin-filter-active" : ""}`}
              onClick={() => setOrderFilter("month")}
            >
              This Month
            </button>
            <button
              className={`admin-filter-btn ${orderFilter === "year" ? "admin-filter-active" : ""}`}
              onClick={() => setOrderFilter("year")}
            >
              This Year
            </button>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>User</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Paid ($)</th>
                  <th>Paid?</th>
                  <th>Image</th>
                  <th>Item ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders && filteredOrders.length > 0 ? (
                  filteredOrders.map((o, index) => {
                    const firstItem = o.items && o.items.length > 0 ? o.items[0] : null;
                    const dateObj = new Date(o.date || o.createdAt);
                    const dateLabel = dateObj.toLocaleDateString();
                    return (
                      <tr
                        key={o._id}
                        className={highlightedOrderId === o._id ? "admin-order-row-highlight" : ""}
                      >
                        <td>{index + 1}</td>
                        <td>{firstItem ? firstItem.name : "-"}</td>
                        <td>{o.userId}</td>
                        <td>{dateLabel}</td>
                        <td>{o.status || "Pending"}</td>
                        <td>{o.amount}</td>
                        <td>{o.payment ? "Yes" : "No"}</td>
                        <td>
                          {firstItem && firstItem.image && (
                            <img
                              src={firstItem.image}
                              alt={firstItem.name}
                              style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
                            />
                          )}
                        </td>
                        <td>{firstItem && firstItem._id ? firstItem._id : "-"}</td>
                        <td>
                          <button onClick={() => handleDeleteOrder(o._id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    if (active === "notifications") {
      return (
        <>
          <h1>Notifications</h1>
          <p>Notifications view is under construction.</p>
        </>
      );
    }

    if (active === "analytics") {
      return (
        <>
          <h1>Analytics</h1>
          <p>Analytics view is under construction.</p>
        </>
      );
    }

    return null;
  };

  return (
    <div className="admin-layout">
      <header className="admin-navbar">
        <img className="admin-logo" src={assets.logo} alt="Logo" />
        <button
          type="button"
          className="admin-nav-bell-wrapper"
          onClick={() => setHeaderNotifOpen((prev) => !prev)}
        >
          <span className="admin-nav-bell-icon">
            <MdNotificationsNone />
            {adminUnreadCount > 0 && (
              <span className="admin-nav-bell-badge">
                {adminUnreadCount > 9 ? "9+" : adminUnreadCount}
              </span>
            )}
          </span>
        </button>
        {headerNotifOpen && adminUnreadNotifications.length > 0 && (
          <div className="admin-nav-bell-menu">
            <ul>
              {adminUnreadNotifications.slice(0, 6).map((n) => {
                const relatedOrder = orders.find((o) => o._id === n.id) || null;
                return (
                  <li
                    key={`header-${n.role}-${n.id}-${n.dateLabel}`}
                    className="admin-nav-bell-item"
                    onClick={() => {
                      dispatch(markNotificationRead({ id: n.id, role: "admin" }));
                      setHeaderNotifOpen(false);
                      if (relatedOrder) {
                        setSelectedNotifOrder(relatedOrder);
                      }
                      navigate(`/admin/notifications/${n.id}`);
                    }}
                  >
                    <div className="admin-nav-bell-item-main">
                      <span className="admin-nav-bell-item-title">{n.title}</span>
                      {n.status && (
                        <span className={`admin-dashboard-status-pill status-${(n.status || "Pending").toLowerCase()}`}>
                          {n.status}
                        </span>
                      )}
                    </div>
                    <div className="admin-nav-bell-item-meta">{n.dateLabel}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="admin-avatar-section">
          <div
            className="admin-avatar"
            onClick={() => setAvatarMenuOpen((prev) => !prev)}
          >
            {user && user.avatar ? (
              <img src={user.avatar} alt={user.name || "Admin"} />
            ) : (
              <MdPerson />
            )}
          </div>
          {avatarMenuOpen && (
            <div className="admin-avatar-menu">
              <button onClick={() => { setAvatarMenuOpen(false); navigate("/settings"); }}>Settings</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
        <span className="admin-nav-bell-label">Dashboard</span>
      </header>

      <div className="admin-main">
        <aside className={`admin-sidebar ${sidebarCollapsed ? "admin-sidebar-collapsed" : ""}`}>
          <button
            className="admin-sidebar-toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {sidebarCollapsed ? <MdMenu /> : <MdMenuOpen />}
          </button>
          <div className="admin-sidebar-options">
            <button
              className={`admin-sidebar-option ${active === "dashboard" ? "admin-active" : ""}`}
              onClick={() => setActive("dashboard")}
            >
              <span className="admin-sidebar-icon"><MdDashboard /></span>
              <span className="admin-sidebar-label">Dashboard</span>
            </button>
            <button
              className={`admin-sidebar-option ${active === "add" ? "admin-active" : ""}`}
              onClick={() => setActive("add")}
            >
              <span className="admin-sidebar-icon"><MdAddCircleOutline /></span>
              <span className="admin-sidebar-label">Add Items</span>
            </button>
            <button
              className={`admin-sidebar-option ${active === "list" ? "admin-active" : ""}`}
              onClick={() => setActive("list")}
            >
              <span className="admin-sidebar-icon"><MdListAlt /></span>
              <span className="admin-sidebar-label">List Items</span>
            </button>
            <button
              className={`admin-sidebar-option ${active === "orders" ? "admin-active" : ""}`}
              onClick={() => setActive("orders")}
            >
              <span className="admin-sidebar-icon"><MdReceiptLong /></span>
              <span className="admin-sidebar-label">Orders</span>
            </button>
            <button
              className={`admin-sidebar-option ${active === "notifications" ? "admin-active" : ""}`}
              onClick={() => setActive("notifications")}
            >
              <span className="admin-sidebar-icon"><MdListAlt /></span>
              <span className="admin-sidebar-label">Notifications</span>
            </button>
            <button
              className={`admin-sidebar-option ${active === "analytics" ? "admin-active" : ""}`}
              onClick={() => setActive("analytics")}
            >
              <span className="admin-sidebar-icon"><MdInsights /></span>
              <span className="admin-sidebar-label">Analytics</span>
            </button>
          </div>
        </aside>

        <main className={`admin-content ${sidebarCollapsed ? "admin-content-wide" : ""}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
