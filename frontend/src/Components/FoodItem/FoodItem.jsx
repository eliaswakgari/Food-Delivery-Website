import React, { useContext} from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContextProvider'
const FoodItem = ({id,price,description,image,name}) => {
        //  const [itemCount,setItemCount]=useState(0)
         // console.log('not item count',!itemCount);
         //falsy of integer is 0 (!itemCount=true=0)
         const {cartItems,removeFromCart,addToCart,url}=useContext(StoreContext)
         
  return (
     <div className="food-item">
         <div className="food-item-img-container">
         <img src={url+"/images/"+image} alt="" className="food-item-image" />
         { !cartItems[id] /* !itemCount======= itemCount===0 */
          ?<img className='add' onClick={()=>addToCart(id)} src={assets.add_icon_white} alt="" />
          :<div className='food-item-counter'>
                  <img onClick={()=>addToCart(id)} src={assets.remove_icon_red}alt="" />
                  <p>{cartItems[id]}</p>
                  <img onClick={()=>addToCart(id)} src={assets.add_icon_green} alt="" />
         </div>}
         </div>
         <div className="food-item-info">
         <div className="food-item-name-rating">
         <p>{name}</p>
         <img src={assets.rating_starts} alt="" />
         </div>
         <p className="food-item-desc">{description}</p>
         <p className="food-item-price">${price}</p>
         </div>
     </div>
  )
}

export default FoodItem
