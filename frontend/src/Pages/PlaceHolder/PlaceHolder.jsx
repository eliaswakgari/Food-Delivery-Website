import { useState } from "react";
import "./PlaceHolder.css";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";

const PlaceHolder = () => {
  const token = useSelector((state) => state.auth.token);
  const food_list = useSelector((state) => state.food.food_list) || [];
  const cartItems = useSelector((state) => state.cart.cartItems) || {};
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });
  const onchangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

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

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("To proceed with payment, please login.");
      return;
    }
    //create order item
    let orderItems = [];
    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        const itemInfo = { ...item, quantity: cartItems[item._id] };
        orderItems.push(itemInfo);
      }
    });
    //order data item
    const orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount(),
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/order/place`, orderData, {
        // Rely on fd_token cookie for backend auth; no need to send token header
        withCredentials: true,
      });

      if (response.data.success) {
        const { session_url } = response.data;
        window.location.replace(session_url);
      } else {
        alert(response.data.message || "Payment could not be started. Please try again.");
      }
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Network or server error while starting payment. Please check your connection and try again.");
    }
  };

  return (
    <form action="#" onSubmit={placeOrder} className="place-order">
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input
            required
            name="firstName"
            value={data.firstName}
            onChange={onchangeHandler}
            type="text"
            placeholder="First name"
          />
          <input
            required
            name="lastName"
            value={data.lastName}
            onChange={onchangeHandler}
            type="text"
            placeholder="Last name"
          />
        </div>
        <input
          required
          name="email"
          value={data.email}
          onChange={onchangeHandler}
          type="email"
          placeholder="Email Address"
        />
        <input
          required
          name="street"
          value={data.street}
          onChange={onchangeHandler}
          type="text"
          placeholder="Street"
        />
        <div className="multi-fields">
          <input
            required
            name="city"
            value={data.city}
            onChange={onchangeHandler}
            type="text"
            placeholder="City"
          />
          <input
            required
            name="state"
            value={data.state}
            onChange={onchangeHandler}
            type="text"
            placeholder="State"
          />
        </div>
        <div className="multi-fields">
          <input
            required
            name="zipCode"
            value={data.zipCode}
            onChange={onchangeHandler}
            type="number"
            placeholder="Zip code"
          />
          <input
            required
            name="country"
            value={data.country}
            onChange={onchangeHandler}
            type="text"
            placeholder="Country"
          />
        </div>
        <input
          required
          name="phone"
          value={data.phone}
          onChange={onchangeHandler}
          type="text"
          placeholder="Phone Number"
        />
      </div>
      <div className="place-order-right">
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
              <p>
                ${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}
              </p>
            </div>
          </div>
          <button type="submit">PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  );
};

export default PlaceHolder;
