const userModel = require("../models/userModel");

//add items user to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    let userData = await userModel.findById(userId);
    let cartData = await userData.cartData; //extract cart Object from user model
    // Check if the item with id([req.body.itemId]) is already in the cart and update accordingly
    if (!cartData[req.body.itemId]) {
      //if didn't already found initialize item id as key =value is 1
      cartData[req.body.itemId] = 1;
    } else {
      //if already exist update value by 1
      cartData[req.body.itemId] += 1;
    }
    // Update the user document with the modified cartData
    await userModel.findByIdAndUpdate(userId, { cartData });
    return res.status(201).json({ success: true, message: "Cart Added" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Error updating cart" });
  }
};
//remove items user from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    let userData = await userModel.findById(userId);
    let cartData = await userData.cartData; //extract cart Object from user model
    //check if the cart item id found in cart
    if (cartData[req.body.itemId] > 0) {
      cartData[req.body.itemId] -= 1;
    }
    // Update the user document with the modified cartData
    await userModel.findByIdAndUpdate(userId, { cartData });
    return res.status(201).json({ success: true, message: "Cart Removed" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Error removing cart" });
  }
};
//fetch user cart data
const getCart = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    let userData = await userModel.findById(userId);
    let cartData = await userData.cartData; //extract cart Object from user model
    return res.status(200).json({ success: true, cartData: cartData });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error updating cart" });
  }
};

module.exports = { addToCart, removeFromCart, getCart };
