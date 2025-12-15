import React from "react";
import "./Explore.css";

const Explore = ({ category, setCategory, categories = [] }) => {
         const options = ["All", ...categories.filter((c, idx) => categories.indexOf(c) === idx)];

         return (
                  <div className="explore">
                           <h2>Explore Our Menu</h2>
                           {/* Desktop/tablet: pills */}
                           <div className="explore-list">
                                    {options.map((cat) => (
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
                                             {options.map((cat) => (
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
