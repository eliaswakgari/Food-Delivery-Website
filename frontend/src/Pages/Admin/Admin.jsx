import React, { useEffect, useMemo, useState } from "react";
import "./Admin.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { MdDashboard, MdAddCircleOutline, MdListAlt, MdReceiptLong, MdInsights, MdMenu, MdMenuOpen, MdPerson, MdNotificationsNone, MdAttachMoney, MdTaskAlt, MdPendingActions, MdTrendingUp } from "react-icons/md";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import { fetchFood, setFoodList } from "../../store/foodSlice";
import { logout } from "../../store/authSlice";
import { upsertNotification, markNotificationRead } from "../../store/notificationSlice";

const STATUS_SEQUENCE = ["Pending", "Preparing", "Ready", "Delivered"];

const normalizeStatus = (status) => {
  if (!status) return "Pending";
  if (status === "Food Processing") return "Preparing";
  return status;
};

const getImageSrc = (image) => {
  if (!image) return null;
  if (typeof image !== "string") return null;
  if (image.startsWith("http")) return image;
  if (image.startsWith("/")) return `${API_BASE_URL}${image}`;
  return `${API_BASE_URL}/images/${image}`;
};

const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId: routeOrderIdParam } = useParams();
  const [active, setActive] = useState("dashboard");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const socket = useSelector((state) => state.socket.socket);
  const food_list = useSelector((state) => state.food.food_list);
  const allNotifications = useSelector((state) => state.notifications.items);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState("unread"); // all | unread | read
  const [selectedNotifOrder, setSelectedNotifOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
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

  const notificationsList = useMemo(
    () => (Array.isArray(allNotifications) ? allNotifications : []),
    [allNotifications]
  );

  const adminUnreadCount = notificationsList.filter(
    (n) => n.role === "admin" && !n.read
  ).length;

  const adminTotalCount = notificationsList.filter((n) => n.role === "admin").length;
  const adminReadCount = Math.max(0, adminTotalCount - adminUnreadCount);

  const adminUnreadNotifications = notificationsList.filter(
    (n) => n.role === "admin" && !n.read
  );

  const adminNotificationsFiltered = useMemo(() => {
    const list = notificationsList.filter((n) => n.role === "admin");
    const filtered = list.filter((n) => {
      if (notifFilter === "all") return true;
      if (notifFilter === "unread") return !n.read;
      if (notifFilter === "read") return !!n.read;
      return true;
    });

    // Sort newest first using dateLabel if possible, fallback to stable order
    return filtered
      .slice()
      .sort((a, b) => {
        const da = new Date(a.dateLabel || 0).getTime();
        const db = new Date(b.dateLabel || 0).getTime();
        return db - da;
      });
  }, [notificationsList, notifFilter]);

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

  const isOrdersRoute = location.pathname.startsWith("/admin/orders/");
  const isNotificationsRoute = location.pathname.startsWith("/admin/notifications/");
  const routeOrderId = isOrdersRoute ? routeOrderIdParam : null;
  const routeNotificationOrderId = isNotificationsRoute ? routeOrderIdParam : null;

  const getNextStatus = (status) => {
    const s = normalizeStatus(status);
    const idx = STATUS_SEQUENCE.indexOf(s);
    if (idx === -1) return null;
    return STATUS_SEQUENCE[idx + 1] || null;
  };

  const statusPillClass = (status) => {
    const s = normalizeStatus(status).toLowerCase();
    if (s === "pending") return "admin-dashboard-status-pill status-pending";
    if (s === "preparing") return "admin-dashboard-status-pill status-preparing";
    if (s === "ready") return "admin-dashboard-status-pill status-ready";
    if (s === "delivered") return "admin-dashboard-status-pill status-delivered";
    return "admin-dashboard-status-pill";
  };

  const fetchOrderDetail = async (id) => {
    if (!id) return null;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/order/admin-order/${id}`, {
        withCredentials: true,
      });
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.error("Failed to load order detail", err);
    }
    return null;
  };

  const handleStatusUpdate = async (orderId, nextStatus) => {
    if (!orderId || !nextStatus) return;
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/order/admin-order/${orderId}/status`,
        { status: nextStatus },
        { withCredentials: true }
      );
      if (res.data && res.data.success && res.data.data) {
        const updated = res.data.data;
        setOrders((prev) => (Array.isArray(prev) ? prev : []).map((o) => (o._id === updated._id ? updated : o)));
        setSelectedOrder((prev) => (prev && prev._id === updated._id ? updated : prev));
        setSelectedNotifOrder((prev) => (prev && prev._id === updated._id ? updated : prev));
      }
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  };

  // When visiting /admin/orders/:orderId directly, open order details
  useEffect(() => {
    const open = async () => {
      if (!routeOrderId) return;
      setActive("orders");
      const order = await fetchOrderDetail(routeOrderId);
      if (order) setSelectedOrder(order);
    };
    open();
  }, [routeOrderId]);

  // When visiting /admin/notifications/:orderId directly, focus Notifications detail view
  useEffect(() => {
    const open = async () => {
      if (!routeNotificationOrderId) return;
      setActive("notifications");
      dispatch(markNotificationRead({ id: routeNotificationOrderId, role: "admin" }));
      const order = await fetchOrderDetail(routeNotificationOrderId);
      if (order) setSelectedNotifOrder(order);
    };
    open();
  }, [routeNotificationOrderId, dispatch]);

  // Realtime updates inside Admin panel
  useEffect(() => {
    if (!socket) return;

    const onNewOrder = (payload = {}) => {
      const orderId = payload.orderId || payload._id;
      if (!orderId) return;

      const title = payload.title || "New order";
      const dateLabel = new Date(payload.date || Date.now()).toLocaleString();

      dispatch(
        upsertNotification({
          id: orderId,
          role: "admin",
          title,
          dateLabel,
          status: payload.status || "Pending",
          read: false,
        })
      );

      // Pull latest list so dashboard/orders are accurate
      setOrders((prev) => {
        if (!Array.isArray(prev)) return prev;
        if (prev.some((o) => o._id === orderId)) return prev;
        return prev;
      });
    };

    const onPaymentUpdated = ({ orderId, payment }) => {
      if (!orderId) return;
      setOrders((prev) => (Array.isArray(prev) ? prev.map((o) => (o._id === orderId ? { ...o, payment: !!payment } : o)) : prev));
      setSelectedOrder((prev) => (prev && prev._id === orderId ? { ...prev, payment: !!payment } : prev));
      setSelectedNotifOrder((prev) => (prev && prev._id === orderId ? { ...prev, payment: !!payment } : prev));
    };

    const onStatusChanged = ({ orderId, status }) => {
      if (!orderId) return;
      setOrders((prev) => (Array.isArray(prev) ? prev.map((o) => (o._id === orderId ? { ...o, status } : o)) : prev));
      setSelectedOrder((prev) => (prev && prev._id === orderId ? { ...prev, status } : prev));
      setSelectedNotifOrder((prev) => (prev && prev._id === orderId ? { ...prev, status } : prev));
    };

    socket.on("order:new", onNewOrder);
    socket.on("order:paymentUpdated", onPaymentUpdated);
    socket.on("order:statusChanged", onStatusChanged);

    return () => {
      socket.off("order:new", onNewOrder);
      socket.off("order:paymentUpdated", onPaymentUpdated);
      socket.off("order:statusChanged", onStatusChanged);
    };
  }, [socket, dispatch]);

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
    const list = Array.isArray(food_list) ? food_list : [];

    // Also include any extra categories that already exist in the database
    list.forEach((item) => {
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
          <div className="admin-modal admin-modal-scroll">
            <h1>Add Items</h1>
            <form className="admin-add-form" onSubmit={handleAddSubmit}>
              <input
                type="text"
                placeholder="Food name"
                name="name"
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

      const handleOpenOrder = async (id) => {
        if (!id) return;
        navigate(`/admin/orders/${id}`);
        const order = await fetchOrderDetail(id);
        if (order) setSelectedOrder(order);
      };

      const handleBackToOrders = () => {
        setSelectedOrder(null);
        navigate("/admin");
      };

      if (selectedOrder) {
        const status = normalizeStatus(selectedOrder.status);
        const next = getNextStatus(status);
        const items = Array.isArray(selectedOrder.items) ? selectedOrder.items : [];

        return (
          <>
            <h1>Order Details</h1>
            <div className="admin-notification-detail-header">
              <button type="button" className="admin-back-button" onClick={handleBackToOrders}>
                Back to Orders
              </button>
            </div>

            <div className="admin-order-detail">
              <div className="admin-order-detail-card">
                <h2>Order #{String(selectedOrder._id).slice(-6)}</h2>

                <div className="admin-order-detail-info">
                  <div className="admin-order-detail-row">
                    <span>Status</span>
                    <span className={statusPillClass(status)}>{status}</span>
                  </div>
                  <div className="admin-order-detail-row">
                    <span>Paid</span>
                    <span>{selectedOrder.payment ? "Yes" : "No"}</span>
                  </div>
                  <div className="admin-order-detail-row">
                    <span>Amount</span>
                    <span>${Number(selectedOrder.amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="admin-order-detail-row">
                    <span>Date</span>
                    <span>{new Date(selectedOrder.date || selectedOrder.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                </div>

                {next && (
                  <button
                    type="button"
                    className="admin-mark-read-button"
                    onClick={() => handleStatusUpdate(selectedOrder._id, next)}
                  >
                    Move to {next}
                  </button>
                )}

                {items.length > 0 && (
                  <div className="admin-order-items">
                    <h3>Items</h3>
                    <div className="admin-order-items-list">
                      {items.map((it, idx) => {
                        const img = getImageSrc(it.image);
                        return (
                          <div className="admin-order-item" key={`${it._id || idx}`}
                          >
                            {img ? (
                              <img className="admin-order-item-image" src={img} alt={it.name || "Item"} />
                            ) : null}
                            <div className="admin-order-item-info">
                              <div className="admin-order-item-name">{it.name}</div>
                              <div className="admin-order-item-price">
                                x{Number(it.quantity || 1)} • ${Number(it.price || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      }

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
                    const imgSrc = firstItem ? getImageSrc(firstItem.image) : null;
                    return (
                      <tr
                        key={o._id}
                        className={highlightedOrderId === o._id ? "admin-order-row-highlight" : ""}
                        onClick={() => handleOpenOrder(o._id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{index + 1}</td>
                        <td>{firstItem ? firstItem.name : "-"}</td>
                        <td>{o.userId}</td>
                        <td>{dateLabel}</td>
                        <td><span className={statusPillClass(o.status)}>{normalizeStatus(o.status)}</span></td>
                        <td>{o.amount}</td>
                        <td>{o.payment ? "Yes" : "No"}</td>
                        <td>
                          {imgSrc && (
                            <img
                              src={imgSrc}
                              alt={firstItem.name}
                              style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
                            />
                          )}
                        </td>
                        <td>{firstItem && firstItem._id ? firstItem._id : "-"}</td>
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(o._id);
                            }}
                          >
                            Delete
                          </button>
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
      const selected = selectedNotifOrder;

      if (selected) {
        const status = normalizeStatus(selected.status);
        const next = getNextStatus(status);
        const items = Array.isArray(selected.items) ? selected.items : [];

        return (
          <div className="admin-notification-detail">
            <div className="admin-notification-detail-header">
              <button
                type="button"
                className="admin-back-button"
                onClick={() => {
                  setSelectedNotifOrder(null);
                  navigate("/admin");
                }}
              >
                Back
              </button>
            </div>

            <div className="admin-notification-detail-card">
              <div className="admin-notification-detail-title">
                <h2>Notification</h2>
              </div>
              <div className="admin-notification-detail-meta">
                <p><strong>Order</strong>: #{String(selected._id).slice(-6)}</p>
                <p><strong>Status</strong>: <span className={statusPillClass(status)}>{status}</span></p>
                <p><strong>Paid</strong>: {selected.payment ? "Yes" : "No"}</p>
              </div>
            </div>

            <div className="admin-order-detail-card">
              <h2>Order Details</h2>
              <div className="admin-order-detail-info">
                <div className="admin-order-detail-row">
                  <span>Amount</span>
                  <span>${Number(selected.amount || 0).toFixed(2)}</span>
                </div>
                <div className="admin-order-detail-row">
                  <span>Date</span>
                  <span>{new Date(selected.date || selected.createdAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="admin-mark-read-button"
                  onClick={() => navigate(`/admin/orders/${selected._id}`)}
                >
                  Open Order
                </button>
                {next && (
                  <button
                    type="button"
                    className="admin-filter-btn"
                    onClick={() => handleStatusUpdate(selected._id, next)}
                  >
                    Move to {next}
                  </button>
                )}
              </div>

              {items.length > 0 && (
                <div className="admin-order-items">
                  <h3>Items</h3>
                  <div className="admin-order-items-list">
                    {items.map((it, idx) => {
                      const img = getImageSrc(it.image);
                      return (
                        <div className="admin-order-item" key={`${it._id || idx}`}
                        >
                          {img ? (
                            <img className="admin-order-item-image" src={img} alt={it.name || "Item"} />
                          ) : null}
                          <div className="admin-order-item-info">
                            <div className="admin-order-item-name">{it.name}</div>
                            <div className="admin-order-item-price">x{Number(it.quantity || 1)} • ${Number(it.price || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <>
          <h1>Notifications</h1>

          <div className="admin-notifications-filters">
            <button
              className={`admin-filter-btn ${notifFilter === "all" ? "admin-filter-active" : ""}`}
              onClick={() => setNotifFilter("all")}
            >
              All ({adminTotalCount})
            </button>
            <button
              className={`admin-filter-btn ${notifFilter === "unread" ? "admin-filter-active" : ""}`}
              onClick={() => setNotifFilter("unread")}
            >
              Unread ({adminUnreadCount})
            </button>
            <button
              className={`admin-filter-btn ${notifFilter === "read" ? "admin-filter-active" : ""}`}
              onClick={() => setNotifFilter("read")}
            >
              Read ({adminReadCount})
            </button>
          </div>

          {adminNotificationsFiltered.length === 0 ? (
            <div className="admin-notifications-empty">No notifications.</div>
          ) : (
            <div className="admin-notifications-list">
              {adminNotificationsFiltered.map((n) => (
                <div
                  key={`${n.role}-${n.id}-${n.dateLabel}`}
                  className={`admin-notification-card ${!n.read ? "admin-notification-unread" : ""}`}
                  onClick={async () => {
                    dispatch(markNotificationRead({ id: n.id, role: "admin" }));
                    const order = await fetchOrderDetail(n.id);
                    if (order) setSelectedNotifOrder(order);
                    navigate(`/admin/notifications/${n.id}`);
                  }}
                >
                  <div className="admin-notification-card-header">
                    <h3>{n.title}</h3>
                    {!n.read && <span className="admin-notification-unread-dot" />}
                  </div>
                  <div className="admin-notification-card-body">
                    <span className="admin-notification-date">{n.dateLabel}</span>
                  </div>
                  <div className="admin-notification-card-footer">
                    <span>Order #{String(n.id).slice(-6)}</span>
                    {n.status ? (
                      <span className={statusPillClass(n.status)}>{normalizeStatus(n.status)}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      );
    }

    if (active === "analytics") {
      const paidOrders = orders.filter((o) => !!o.payment);
      const revenue = paidOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
      const totalOrders = orders.length;
      const paidCount = paidOrders.length;
      const pendingCount = orders.filter((o) => normalizeStatus(o.status) === "Pending").length;
      const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;

      const statusCounts = STATUS_SEQUENCE.reduce((acc, s) => {
        acc[s] = orders.filter((o) => normalizeStatus(o.status) === s).length;
        return acc;
      }, {});

      const maxStatusCount = Math.max(1, ...Object.values(statusCounts));

      const topItems = (() => {
        const map = new Map();
        orders.forEach((o) => {
          const items = Array.isArray(o.items) ? o.items : [];
          items.forEach((it) => {
            const key = it.name || it._id;
            if (!key) return;
            const current = map.get(key) || { name: it.name || "Item", count: 0 };
            current.count += Number(it.quantity || 1);
            map.set(key, current);
          });
        });
        return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
      })();

      return (
        <>
          <h1>Analytics</h1>

          <div className="admin-analytics-metrics">
            <div className="admin-analytics-metric-card">
              <div className="admin-analytics-metric-icon revenue">
                <MdAttachMoney />
              </div>
              <div className="admin-analytics-metric-content">
                <div className="admin-analytics-metric-label">Revenue (Paid)</div>
                <div className="admin-analytics-metric-value">${revenue.toFixed(2)}</div>
                <div className="admin-analytics-metric-sub">Paid orders only</div>
              </div>
            </div>
            <div className="admin-analytics-metric-card">
              <div className="admin-analytics-metric-icon paid">
                <MdTaskAlt />
              </div>
              <div className="admin-analytics-metric-content">
                <div className="admin-analytics-metric-label">Paid Orders</div>
                <div className="admin-analytics-metric-value">{paidCount}</div>
                <div className="admin-analytics-metric-sub">Out of {totalOrders}</div>
              </div>
            </div>
            <div className="admin-analytics-metric-card">
              <div className="admin-analytics-metric-icon pending">
                <MdPendingActions />
              </div>
              <div className="admin-analytics-metric-content">
                <div className="admin-analytics-metric-label">Pending</div>
                <div className="admin-analytics-metric-value">{pendingCount}</div>
                <div className="admin-analytics-metric-sub">Needs action</div>
              </div>
            </div>
            <div className="admin-analytics-metric-card">
              <div className="admin-analytics-metric-icon avg">
                <MdTrendingUp />
              </div>
              <div className="admin-analytics-metric-content">
                <div className="admin-analytics-metric-label">Avg Order</div>
                <div className="admin-analytics-metric-value">${avgOrder.toFixed(2)}</div>
                <div className="admin-analytics-metric-sub">Based on all orders</div>
              </div>
            </div>
          </div>

          <div className="admin-analytics-charts">
            <div className="admin-analytics-chart-card">
              <h2>Orders by Status</h2>
              <div className="admin-analytics-bar-chart">
                {STATUS_SEQUENCE.map((s) => {
                  const count = statusCounts[s] || 0;
                  const height = Math.max(4, Math.round((count / maxStatusCount) * 150));
                  return (
                    <div key={s} className="admin-analytics-bar-wrapper">
                      <div className="admin-analytics-bar-container">
                        <div className="admin-analytics-bar" style={{ height }}>
                          <span className="admin-analytics-bar-value">{count}</span>
                        </div>
                      </div>
                      <div className="admin-analytics-bar-label">{s}</div>
                      <div className="admin-analytics-bar-count">orders</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="admin-analytics-chart-card">
              <h2>Top Items</h2>
              <div className="admin-analytics-top-items">
                {topItems.length === 0 ? (
                  <div className="admin-dashboard-recent-empty">No order items yet.</div>
                ) : (
                  topItems.map((it) => (
                    <div key={it.name} className="admin-analytics-top-item">
                      <div className="admin-analytics-top-item-rank">#{topItems.indexOf(it) + 1}</div>
                      <div>
                        <div className="admin-analytics-top-item-name">{it.name}</div>
                        <div className="admin-analytics-top-item-count">{it.count} sold</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="admin-layout">
      <header className="admin-navbar">
        <img className="admin-logo" src={assets.logo} alt="Logo" />

        <div className="admin-navbar-right">
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="admin-nav-bell-wrapper"
              onClick={() => setHeaderNotifOpen((prev) => !prev)}
            >
              <span className="admin-nav-bell-icon">
                <MdNotificationsNone />
                {adminUnreadCount > 0 && (
                  <span className="admin-nav-bell-badge">
                    {adminUnreadCount}
                  </span>
                )}
              </span>
            </button>

            {headerNotifOpen && adminUnreadNotifications.length > 0 && (
              <div className="admin-nav-bell-menu">
                <div className="admin-nav-bell-menu-header">Unread</div>
                <ul>
                  {adminUnreadNotifications.slice(0, 8).map((n) => {
                    const relatedOrder = orders.find((o) => o._id === n.id) || null;
                    return (
                      <li
                        key={`header-${n.role}-${n.id}-${n.dateLabel}`}
                        className="admin-nav-bell-item"
                        onClick={async () => {
                          dispatch(markNotificationRead({ id: n.id, role: "admin" }));
                          setHeaderNotifOpen(false);

                          const order = relatedOrder || (await fetchOrderDetail(n.id));
                          if (order) {
                            setSelectedNotifOrder(order);
                          }

                          navigate(`/admin/notifications/${n.id}`);
                        }}
                      >
                        <div className="admin-nav-bell-item-main">
                          <span className="admin-nav-bell-item-title">{n.title}</span>
                          {n.status && (
                            <span className={statusPillClass(n.status)}>
                              {normalizeStatus(n.status)}
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
          </div>

          <div className="admin-avatar-section">
            <div
              className="admin-avatar"
              onClick={() => setAvatarMenuOpen((prev) => !prev)}
            >
              {user && user.avatar ? (
                <img src={getImageSrc(user.avatar)} alt={user.name || "Admin"} />
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
        </div>
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
