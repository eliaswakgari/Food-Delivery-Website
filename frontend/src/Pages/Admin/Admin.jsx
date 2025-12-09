import React, { useEffect, useState } from "react";
import "./Admin.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { MdDashboard, MdAddCircleOutline, MdListAlt, MdReceiptLong, MdInsights } from "react-icons/md";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import { setFoodList } from "../../store/foodSlice";

const Admin = () => {
  const location = useLocation();
  const [active, setActive] = useState("dashboard");
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const food_list = useSelector((state) => state.food.food_list) || [];
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);

  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Pizza",
    image: null,
  });
  const [addStatus, setAddStatus] = useState("");
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("all"); // all | today | week | month | year

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

  const handleDeleteOrder = async (id) => {
    if (!token) {
      alert("You must be logged in as admin to delete orders.");
      return;
    }

    if (!window.confirm("Delete this order?")) return;

    try {
      const res = await axios.delete(`${API_BASE_URL}/api/order/admin-order/${id}`, {
        headers: { token },
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
      if ((active !== "orders" && active !== "analytics") || !token) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/order/admin-list`, {
          headers: { token },
        });
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    };

    fetchOrders();
  }, [active, token]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddStatus("");

    if (!token) {
      setAddStatus("You must be logged in as admin to add food.");
      return;
    }

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
        headers: {
          token,
        },
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
    if (!token) {
      alert("You must be logged in as admin to delete food.");
      return;
    }

    if (!window.confirm("Delete this food item?")) return;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/food/remove`,
        { id },
        { headers: { token } }
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

    if (active === "add") {
      return (
        <>
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
              <option value="Pizza">Pizza</option>
              <option value="Burgers">Burgers</option>
              <option value="Pasta">Pasta</option>
              <option value="Salads">Salads</option>
              <option value="Desserts">Desserts</option>
              <option value="Drinks">Drinks</option>
              <option value="Sandwiches">Sandwiches</option>
              <option value="Chicken">Chicken</option>
              <option value="Seafood">Seafood</option>
              <option value="Other">Other</option>
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
        </>
      );
    }

    if (active === "list") {
      return (
        <>
          <h1>List Items</h1>
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
                      <td>
                        <select
                          value={o.status || "Pending"}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              const res = await axios.patch(
                                `${API_BASE_URL}/api/order/admin-order/${o._id}/status`,
                                { status: newStatus },
                                { headers: { token } }
                              );
                              if (res.data && res.data.success) {
                                setOrders((prev) =>
                                  prev.map((ord) =>
                                    ord._id === o._id ? { ...ord, status: newStatus } : ord
                                  )
                                );
                              }
                            } catch (err) {
                              console.error("Failed to update status", err);
                              alert("Could not update order status.");
                            }
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready">Ready</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
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
        </>
      );
    }

    if (active === "analytics") {
      const filteredOrders = applyOrderFilter(orders);
      const totalOrders = filteredOrders.length;
      const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const paidCount = filteredOrders.filter((o) => o.payment).length;
      const unpaidCount = totalOrders - paidCount;

      // Count items to find top ordered item by occurrences
      const itemCounts = {};
      filteredOrders.forEach((o) => {
        if (Array.isArray(o.items)) {
          o.items.forEach((it) => {
            const key = it.name || it._id || "Unknown";
            itemCounts[key] = (itemCounts[key] || 0) + (it.quantity || 1);
          });
        }
      });

      const topItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

      // Build simple graph data: orders per day for last 7 days
      const now = new Date();
      const days = [...Array(7)].map((_, idx) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - idx));
        const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const count = filteredOrders.filter((o) => {
          const od = new Date(o.date || o.createdAt || now);
          return (
            od.getFullYear() === d.getFullYear() &&
            od.getMonth() === d.getMonth() &&
            od.getDate() === d.getDate()
          );
        }).length;
        return { label, count };
      });

      const maxCount = Math.max(1, ...days.map((d) => d.count));

      return (
        <>
          <h1>Analytics</h1>
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

          <div className="admin-analytics-cards">
            <div className="admin-analytics-card">
              <p className="admin-analytics-label">Orders</p>
              <p className="admin-analytics-value">{totalOrders}</p>
            </div>
            <div className="admin-analytics-card">
              <p className="admin-analytics-label">Revenue ($)</p>
              <p className="admin-analytics-value">{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="admin-analytics-card">
              <p className="admin-analytics-label">Paid / Unpaid</p>
              <p className="admin-analytics-value">
                {paidCount} / {unpaidCount}
              </p>
            </div>
            <div className="admin-analytics-card">
              <p className="admin-analytics-label">Top Item</p>
              <p className="admin-analytics-value">
                {topItem ? `${topItem[0]} (${topItem[1]})` : "-"}
              </p>
            </div>
          </div>

          <div className="admin-analytics-graph">
            {days.map((d) => (
              <div key={d.label} className="admin-analytics-bar-wrapper">
                <div
                  className="admin-analytics-bar"
                  style={{ height: d.count === 0 ? "4px" : `${(d.count / maxCount) * 100}%` }}
                  title={`${d.label}: ${d.count} orders`}
                />
                <span className="admin-analytics-bar-label">{d.label}</span>
              </div>
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <h1>Admin Dashboard</h1>
        <p>Welcome, admin. Choose a menu item.</p>
      </>
    );
  };

  return (
    <div className="admin-layout">

      {/* HEADER */}
      <header className="admin-navbar">
        <img className="admin-logo" src={assets.logo} alt="Logo" />
        <img
          className="admin-profile"
          src={assets.profile_image || assets.logo}
          alt="Profile"
        />
      </header>

      {/* MAIN LAYOUT */}
      <div className="admin-main">

        {/* SIDEBAR */}
        <aside className={`admin-sidebar ${sidebarCollapsed ? "admin-sidebar-collapsed" : ""}`}>
          <button
            className="admin-sidebar-toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {sidebarCollapsed ? ">>" : "<<"}
          </button>
          <div className="admin-sidebar-options">
            <button
              className={`admin-sidebar-option ${active === "dashboard" ? "admin-active" : ""
                }`}
              onClick={() => setActive("dashboard")}
            >
              <span className="admin-sidebar-icon"><MdDashboard /></span>
              <span className="admin-sidebar-label">Dashboard</span>
            </button>

            <button
              className={`admin-sidebar-option ${active === "add" ? "admin-active" : ""
                }`}
              onClick={() => setActive("add")}
            >
              <span className="admin-sidebar-icon"><MdAddCircleOutline /></span>
              <span className="admin-sidebar-label">Add Items</span>
            </button>

            <button
              className={`admin-sidebar-option ${active === "list" ? "admin-active" : ""
                }`}
              onClick={() => setActive("list")}
            >
              <span className="admin-sidebar-icon"><MdListAlt /></span>
              <span className="admin-sidebar-label">List Items</span>
            </button>

            <button
              className={`admin-sidebar-option ${active === "orders" ? "admin-active" : ""
                }`}
              onClick={() => setActive("orders")}
            >
              <span className="admin-sidebar-icon"><MdReceiptLong /></span>
              <span className="admin-sidebar-label">Orders</span>
            </button>

            <button
              className={`admin-sidebar-option ${active === "analytics" ? "admin-active" : ""
                }`}
              onClick={() => setActive("analytics")}
            >
              <span className="admin-sidebar-icon"><MdInsights /></span>
              <span className="admin-sidebar-label">Analytics</span>
            </button>
          </div>
        </aside>

        {/* CONTENT */}
        <main className={`admin-content ${sidebarCollapsed ? "admin-content-wide" : ""}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
