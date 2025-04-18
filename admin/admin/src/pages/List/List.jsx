import React, {useEffect, useState } from 'react'
import './List.css'
import axios from 'axios'
import {toast} from 'react-toastify'
const List = () => {
  const [list,setList]=useState([])
  const url='http://localhost:4000'
  const fetchData=async()=>{
    const response=await axios.get(`${url}/api/food/list`)
    if (response.data.success) {
      console.log('response :',response);
      console.log('response.data',response.data);
      console.log('response.data.data',response.data.data);
      setList(response.data.data);
      
    }
    else{
      toast.error('Error')
    }
  }
  const removeFood=async(foodId)=>{
    console.log(foodId);
    
  } 
  useEffect(()=>{
    fetchData()
  },[])
 
  return (
    <div className='list add flex-col'>
   <p>All Foods List</p>
   <div className="list-table">
   <div className="list-table-format title">
   <b>Image</b>
   <b>Name</b>
   <b>Category</b>
   <b>Price</b>
   <b>Action</b>
   </div>
   {
   list.map((item, index) => {
    return(
      <div className="list-table-format" key={index}>
      <img src={`${url}/images/`+item.image} alt="" />
      <p>{item.name}</p>
      <p>{item.category}</p>
      <p>{item.price}</p>
      <p className='cursor' onClick={()=>removeFood(item._id)}>X</p>
   </div>
    )
   })
   }
   </div>
    </div>
  )
}

export default List
