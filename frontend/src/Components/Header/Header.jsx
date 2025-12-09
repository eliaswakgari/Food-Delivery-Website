import React, { useEffect, useState } from "react";
import "./Header.css";
import { assets } from "../../assets/assets";

const slides = [
  {
    id: 1,
    title: "Holiday flavors under $10",
    subtitle: "Burgers, pizzas and more delivered hot to your door.",
    image: assets.menu_8,
    bg: "#064e3b", // dark green
  },
  {
    id: 2,
    title: "Breakfast & coffee deals",
    subtitle: "Kickstart your day with fresh pastries and hot coffee.",
    image: assets.menu_1,
    bg: "#be185d", // magenta
  },
  {
    id: 3,
    title: "Fresh salads & bowls",
    subtitle: "Light, colorful options for your healthy cravings.",
    image: assets.menu_2,
    bg: "#047857", // emerald
  },
  {
    id: 4,
    title: "Family meals under $25",
    subtitle: "Share big portions, small prices. Perfect for movie night.",
    image: assets.menu_3,
    bg: "#7c2d12", // warm brown
  },
  {
    id: 5,
    title: "Desserts & late night snacks",
    subtitle: "End the day sweet with cakes, ice cream and more.",
    image: assets.menu_4,
    bg: "#9d174d", // deep pink
  },
];

const AUTO_SLIDE_MS = 6000;

const Header = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = (index) => {
    const total = slides.length;
    const next = (index + total) % total;
    setActiveIndex(next);
  };

  const handlePrev = () => goTo(activeIndex - 1);
  const handleNext = () => goTo(activeIndex + 1);

  useEffect(() => {
    const timer = setInterval(() => {
      goTo(activeIndex + 1);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [activeIndex]);

  const activeSlide = slides[activeIndex];

  return (
    <div className="hero-carousel" style={{ backgroundColor: activeSlide.bg }}>
      <button className="hero-arrow hero-arrow-left" onClick={handlePrev}>
        &#10094;
      </button>

      <div className="hero-inner">
        <div className="hero-text">
          <p className="hero-kicker">Food delivery deals</p>
          <h2>{activeSlide.title}</h2>
          <p className="hero-subtitle">{activeSlide.subtitle}</p>
          <button className="hero-cta">Order now</button>
        </div>

        <div className="hero-image-wrapper">
          <img
            key={activeSlide.id}
            src={activeSlide.image}
            alt={activeSlide.title}
            className="hero-image"
          />
        </div>
      </div>

      <button className="hero-arrow hero-arrow-right" onClick={handleNext}>
        &#10095;
      </button>

      <div className="hero-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            className={`hero-dot ${index === activeIndex ? "hero-dot-active" : ""}`}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Header;
