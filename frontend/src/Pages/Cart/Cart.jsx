import React from "react";
import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import { removeFromCart } from "../../store/cartSlice";

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
            return (
              <div key={item._id || index}>
                <div className="cart-items-title cart-items-item">
                  <img src={`${API_BASE_URL}/images/${item.image}`} alt="" />
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
        <div className="cart-promo-code">
          <div>
            <p>If you have promo code,Enter it here.</p>
            <div className="cart-promo-code-input">
              <input type="text" placeholder="promo code" />
              <button>Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
