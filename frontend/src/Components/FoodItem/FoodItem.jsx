import React from "react";
import "./FoodItem.css";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, removeFromCart } from "../../store/cartSlice";
import { API_BASE_URL } from "../../store/config";

const FoodItem = ({ id, name, description, price, image }) => {
         const dispatch = useDispatch();
         const cartItems = useSelector((state) => state.cart.cartItems) || {};
         const role = useSelector((state) => state.auth.role);

         const count = cartItems[id] || 0;
         const imageSrc = image && (image.startsWith("http") ? image : `${API_BASE_URL}/images/${image}`);

         const handleAdd = () => {
                  if (role === "admin") {
                           alert("Admin cannot order items only permitted to customers");
                           return;
                  }
                  dispatch(addToCart(id));
         };

         const handleRemove = () => {
                  if (count === 0) return;
                  dispatch(removeFromCart(id));
         };

         return (
                  <div className="food-item">
                           <div className="food-item-img-container">
                                    <img
                                             src={imageSrc}
                                             alt={name}
                                             className="food-item-img"
                                    />
                                    {count > 0 && <div className="food-item-count">{count}</div>}
                                    {name && <div className="food-item-name-badge">{name}</div>}

                                    <div className="food-item-overlay">
                                             <div className="food-item-overlay-content">
                                                      <h3 className="food-item-overlay-title">{name}</h3>
                                                      {description && (
                                                               <p className="food-item-overlay-desc">{description}</p>
                                                      )}
                                                      <p className="food-item-overlay-meta">From ${price}</p>
                                             </div>
                                    </div>
                           </div>
                           <div className="food-item-info">
                                    <div className="food-item-name-price">
                                             <span className="food-item-name">{name}</span>
                                             <span className="food-item-price">${price}</span>
                                    </div>
                                    {description && (
                                             <p className="food-item-desc">{description}</p>
                                    )}
                                    <div className="food-item-controls">
                                             <button type="button" onClick={handleAdd}>
                                                      Add
                                             </button>
                                             <button
                                                      type="button"
                                                      disabled={count === 0}
                                                      onClick={handleRemove}
                                             >
                                                      Remove
                                             </button>
                                    </div>
                           </div>
                  </div>
         );
};

export default FoodItem;
