import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Login.css";
import { assets } from "../../assets/assets";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContextProvider";

const Login = ({ setShowLogin }) => {
  const [currentState, setCurrentState] = useState("Sign Up");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const { url, setToken } = useContext(StoreContext);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const onLogin = async (e) => {
    e.preventDefault();
    try {
      const endpoint = currentState === "Login" ? "/api/user/login" : "/api/user/register";
      const response = await axios.post(`${url}${endpoint}`, data);
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        setShowLogin(false);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error during login/register:", error);
      alert("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <div className="login">
      <form onSubmit={onLogin} className="login-container">
        <div className="login-title">
          <h2>{currentState === "Login" ? "Login" : "Sign Up"}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt="Close"
          />
        </div>
        <div className="login-inputs">
          {currentState !== "Login" && (
            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder="Your name"
              required
            />
          )}
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your email"
            required
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Password"
            required
          />
        </div>
        <button type="submit">
          {currentState === "Sign Up" ? "Create Account" : "Login"}
        </button>
        <div className="login-condition">
          <input type="checkbox" required />
          <p>By continuing, I agree to the terms of use and privacy policy.</p>
        </div>
        {currentState === "Login" ? (
          <p>
            Create a New Account?{" "}
            <span onClick={() => setCurrentState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an Account?{" "}
            <span onClick={() => setCurrentState("Login")}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default Login;
