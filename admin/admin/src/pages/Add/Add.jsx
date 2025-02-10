import React, { useEffect, useState } from "react";
import "./Add.css";
import { assets } from "../../assets/assets";
import axios from 'axios';
import { toast } from "react-toastify";

const Add = () => {
  const [image, setImage] = useState(false);
  const [data, setData] = useState({
    name: "",
    description: "",
    category: "Salad",
    price: ""
  });

  const dataHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setData({ ...data, [name]: value });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const url = 'http://localhost:4000';
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('price', Number(data.price));
    if (image) {
      formData.append('image', image);  // Correctly append the image
    }

    try {
      const response = await axios.post(`${url}/api/food/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',  // Correct content type for FormData
        }
      });
      if (response.data.success) {
        console.log(response.data);
        console.log(response);
        setData({
          name: "",
          description: "",
          category: "Salad",
          price: ""
        });
        setImage(false);
        toast.success(response.data.message)
      }
      else{
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error(error);
      if (error.response) {
        console.error('Response data:', error.response.data);  // Log the server's response
      }
     
    }
  };

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <div className="add">
      <form className="flex-col" onSubmit={onSubmitHandler}>
        <div className="add-img-upload flex-col">
          <p>Upload Image</p>
          <label htmlFor="image">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            name="image"
            id="image"
            hidden
            required
          />
        </div>
        <div className="add-product-name flex-col">
          <p>Product name</p>
          <input onChange={dataHandler} value={data.name} type="text" name="name" placeholder="Type here" />
        </div>
        <div className="add-product-description">
          <p>Product Description</p>
          <textarea
            name="description"
            rows={6}
            placeholder="Write content here"
            required
            onChange={dataHandler} value={data.description}
          ></textarea>
        </div>
        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Product category</p>
            <select name="category" onChange={dataHandler} value={data.category}>
              <option value="Salad">Salad</option>
              <option value="Rolls">Rolls</option>
              <option value="Deserts">Deserts</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Cake">Cake</option>
              <option value="Pure Veg">Pure Veg</option>
              <option value="Pasta">Pasta</option>
              <option value="Nodules">Nodules</option>
            </select>
          </div>
          <div className="add-price flex-col">
            <p>Product Price</p>
            <input onChange={dataHandler} value={data.price} type="number" name="price" placeholder="$20" required />
          </div>
        </div>
        <button className="add-btn" type="submit">
          ADD
        </button>
      </form>
    </div>
  );
};

export default Add;
