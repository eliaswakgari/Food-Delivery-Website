import React, { useState } from 'react'
import Navbar from './Components/Navbar/Navbar'
import Home from './Pages/Home/Home'
import PlaceHolder from './Pages/PlaceHolder/PlaceHolder'
import Cart from './Pages/Cart/Cart'
 import {Routes,Route} from 'react-router-dom'
import Footer from './Components/Footer/Footer'
import Login from './Components/Login/Login'

const App = () => {
  const [showLogin,setShowLogin]=useState(false)
  return (
    <>
    {showLogin?<Login setShowLogin={setShowLogin}/>:<></>}
    <div className='app'>
    <Navbar setShowLogin={setShowLogin}/>
  <Routes>
  <Route path='/' element={<Home/>}/>
  <Route path='/cart' element={<Cart/>}/>
  <Route path='/order' element={<PlaceHolder/>}/>
  </Routes>
    </div>
    <Footer/>
    </>
  )
}

export default App
