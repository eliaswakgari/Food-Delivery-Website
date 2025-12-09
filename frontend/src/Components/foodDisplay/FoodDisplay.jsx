import React from 'react'
import './FoodDisplay.css'
import FoodItem from '../FoodItem/FoodItem'
import { useSelector } from 'react-redux'

const FoodDisplay = ({ category }) => {
  const food_list = useSelector((state) => state.food.food_list) || []
  const searchQuery = useSelector((state) => state.ui.searchQuery) || ""
  return (
    <div className='food-display' id='food-display'>
      <h2>Top dishes near you</h2>
      <div className="food-display-list">
        {
          food_list
            .filter(item => {
              const matchesCategory = category === 'All' || category === item.category;
              const q = (searchQuery || '').toLowerCase();
              const matchesSearch = !q || (item.name || '').toLowerCase().includes(q);
              return matchesCategory && matchesSearch;
            })
            .map((item, index) => (
              <FoodItem key={index} id={item._id} name={item.name} description={item.description} price={item.price} image={item.image} />
            ))
        }
      </div>
    </div>
  )
}

export default FoodDisplay
