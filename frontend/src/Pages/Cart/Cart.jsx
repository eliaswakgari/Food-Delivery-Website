import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import { removeFromCart } from "../../store/cartSlice";

const FALLBACK_IMG_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' rx='16' fill='%23f1f5f9'/%3E%3Cpath d='M35 78l14-18 10 12 10-12 16 18H35z' fill='%2394a3b8'/%3E%3Ccircle cx='48' cy='46' r='7' fill='%2394a3b8'/%3E%3C/svg%3E";

const Cart = () => {
  const dispatch = useDispatch();
  const food_list = useSelector((state) => state.food.food_list) || [];
  const cartItems = useSelector((state) => state.cart.cartItems) || {};
  const role = useSelector((state) => state.auth.role);

  const getTotalCartAmount = () => {
    let total = 0;
    for (const id in cartItems) {
      const item = food_list.find((f) => f._id === id);
      if (item) {
        total += item.price * cartItems[id];
      }
    }
    return total;
  };
  const navigate = useNavigate();
  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item, index) => {
          if (cartItems[item._id]) {
            const imageSrc = item.image
              ? item.image.startsWith("http")
                ? item.image
                : item.image.startsWith("/")
                  ? `${API_BASE_URL}${item.image}`
                  : `${API_BASE_URL}/images/${item.image}`
              : FALLBACK_IMG_SRC;

            return (
              <div key={item._id || index}>
                <div className="cart-items-title cart-items-item">
                  <img
                    src={imageSrc}
                    alt={item.name || "Food"}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMG_SRC;
                    }}
                  />
                  <p>{item.name}</p>
                  <p>${item.price}</p>
                  <p>{cartItems[item._id]}</p>
                  <p>${item.price * cartItems[item._id]}</p>
                  <p onClick={() => dispatch(removeFromCart(item._id))} className="cross">
                    x
                  </p>
                </div>
                <hr />
              </div>
            );
          }
        })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <div>
            <h1>Cart Total</h1>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Total</p>
              <p>${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</p>
            </div>
          </div>
          {role === "admin" ? (
            <p style={{ marginTop: "0.75rem", color: "#b91c1c", fontSize: "0.9rem" }}>
              Admin cannot order items, ordering is only permitted to customers.
            </p>
          ) : (
            <button onClick={() => navigate("/order")}>
              PROCEED TO CHECKOUT
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
