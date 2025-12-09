import React, { useEffect } from 'react'
import './Home.css'
import Header from '../../Components/Header/Header'
import Explore from '../../Components/Explore/Explore'
import FoodDisplay from '../../Components/foodDisplay/FoodDisplay'
import Footer from '../../Components/Footer/Footer'
import { useDispatch, useSelector } from 'react-redux'
import { fetchFood } from '../../store/foodSlice'
import { setCategory as setCategoryAction } from '../../store/uiSlice'

const Home = () => {
  const dispatch = useDispatch()
  const status = useSelector((state) => state.food.status)
  const category = useSelector((state) => state.ui.category) || 'All'

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchFood())
    }
  }, [status, dispatch])

  return (
    <div className="home-page">
      <Header />
      <Explore
        category={category}
        setCategory={(value) => dispatch(setCategoryAction(value))}
      />
      <FoodDisplay category={category} />
    </div>
  )
}

export default Home
