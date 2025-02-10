import React, { useContext, useState } from 'react'
import './Home.css'
import Header from '../../Components/Header/Header'
import Explore from '../../Components/Explore/Explore'
import FoodDisplay from '../../Components/foodDisplay/FoodDisplay'
import AppDownload from '../../Components/AppDownload/Appdownload'
const Home = () => {
  const [category,setCategory]=useState('All')
  return (
    <div>
      <Header/>
      <Explore category={category} setCategory={setCategory}/>
      <FoodDisplay category={category}/>
      <AppDownload/>
    </div>
  )
}

export default Home
