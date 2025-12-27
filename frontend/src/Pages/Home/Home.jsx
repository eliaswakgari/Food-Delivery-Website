import React, { useEffect } from 'react'
import './Home.css'
import Navbar from '../../Components/Navbar/Navbar'
import Header from '../../Components/Header/Header'
import Explore from '../../Components/Explore/Explore'
import FoodDisplay from '../../Components/foodDisplay/FoodDisplay'
import { useDispatch, useSelector } from 'react-redux'
import { fetchFood } from '../../store/foodSlice'
import { setCategory as setCategoryAction } from '../../store/uiSlice'

const Home = () => {
  const dispatch = useDispatch()
  const status = useSelector((state) => state.food.status)
  const food_list = useSelector((state) => state.food.food_list)
  const category = useSelector((state) => state.ui.category) || 'All'

  const categories = React.useMemo(() => {
    const set = new Set()
    const list = Array.isArray(food_list) ? food_list : []
    list.forEach((item) => {
      if (item && item.category) {
        set.add(item.category)
      }
    })
    return Array.from(set)
  }, [food_list])

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchFood())
    }
  }, [status, dispatch])

  return (
    <div className="home-page">
      <Navbar />
      <Header />
      <Explore
        category={category}
        setCategory={(value) => dispatch(setCategoryAction(value))}
        categories={categories}
      />
      <FoodDisplay category={category} />
    </div>
  )
}

export default Home
