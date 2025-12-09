import React from "react";
import "./Explore.css";

const Explore = ({ category, setCategory }) => {
         const categories = [
                  "All",
                  "Pizza",
                  "Burger",
                  "Dessert",
                  "Drinks",
         ];

         return (
                  <div className="explore">
                           <h2>Explore Our Menu</h2>
                           {/* Desktop/tablet: pills */}
                           <div className="explore-list">
                                    {categories.map((cat) => (
                                             <button
                                                      key={cat}
                                                      className={cat === category ? "active" : ""}
                                                      onClick={() => setCategory(cat)}
                                             >
                                                      {cat}
                                             </button>
                                    ))}
                           </div>

                           {/* Mobile: dropdown */}
                           <div className="explore-select-wrapper">
                                    <select
                                             value={category}
                                             onChange={(e) => setCategory(e.target.value)}
                                    >
                                             {categories.map((cat) => (
                                                      <option key={cat} value={cat}>
                                                               {cat}
                                                      </option>
                                             ))}
                                    </select>
                           </div>
                  </div>
         );
};

export default Explore;
