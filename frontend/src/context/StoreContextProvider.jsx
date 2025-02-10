import React, { createContext, useEffect, useState } from 'react'
//import { food_list } from '../assets/assets';
import axios from 'axios'
export const StoreContext=createContext(null)
const StoreContextProvider = ({children}) => {
  const [cartItems,setCartItems]= useState({})
  const [token,setToken]=useState("")
  const [food_list,setFoodList]=useState([])
  const url='http://localhost:4000'
  const addToCart=async(itemId)=>{
     if (!cartItems[itemId]) {
      setCartItems((prev)=>({...prev,[itemId]:1}))
     }
     else{
      setCartItems((prev)=>({...prev,[itemId]:prev[itemId]+1}))
     }
     if (token) {
      await axios.post(url+"/api/cart/add",{itemId},{headers:{token}})
     }
  }
  const removeFromCart=(itemId)=>{
   setCartItems((prev)=>({...prev,[itemId]:prev[itemId]-1}))
  }
  
  const getTotalCartAmount=()=>{
     let totalAmount=0
     for (const item in cartItems) {
        if (cartItems[item]>0) {
         let itemInfo=food_list.find((product)=>product._id===item)
         totalAmount+=itemInfo.price*cartItems[item]
        }
     }
     return totalAmount
  }
  const fetchFoodData=async()=>{
     const response=await axios.get(url+"/api/food/list")
     setFoodList(response.data.data)
  }
  useEffect(()=>{
    async function loadFood(){
       await fetchFoodData()
       if (localStorage.getItem("token")) {
         setToken(localStorage.getItem("token"))
        }
     }
     
     loadFood()
  })
         const contextValue={
                  food_list,
                  cartItems,
                  removeFromCart,
                  setCartItems,
                  addToCart,
                  getTotalCartAmount,
                  url,token,setToken
         }
         // useEffect(()=>{
         //    console.log(cartItems);
            
         // },[cartItems])
  return (
     <StoreContext.Provider value={contextValue}>
     {children}
     </StoreContext.Provider>
     
  )
}

export default StoreContextProvider
