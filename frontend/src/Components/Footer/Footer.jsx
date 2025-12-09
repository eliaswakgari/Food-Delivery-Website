import React from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";

const Footer = () => {
         const year = new Date().getFullYear();

         return (
                  <footer className="footer">
                           <a href="#top" className="footer-back-to-top">
                                    Back to top
                           </a>

                           <div className="footer-main">
                                    <div className="footer-columns">
                                             <div className="footer-column">
                                                      <h4>About TasteDrop</h4>
                                                      <a href="#about">How it works</a>
                                                      <a href="#about">Our story</a>
                                                      <a href="#about">Cities we serve</a>
                                                      <a href="#about">Careers</a>
                                             </div>

                                             <div className="footer-column">
                                                      <h4>Partner with us</h4>
                                                      <a href="#partners">Add your restaurant</a>
                                                      <a href="#partners">Become a courier</a>
                                                      <a href="#partners">Partner support</a>
                                                      <a href="#partners">Restaurant login</a>
                                             </div>

                                             <div className="footer-column">
                                                      <h4>Help & support</h4>
                                                      <a href="#help">Account & orders</a>
                                                      <a href="#help">Payments & refunds</a>
                                                      <a href="#help">Contact support</a>
                                                      <a href="#help">Safety & hygiene</a>
                                             </div>

                                             <div className="footer-column">
                                                      <h4>Apps & social</h4>
                                                      <a href="#apps">Download the app</a>
                                                      <a href="#apps">Order tracking</a>
                                                      <div className="footer-social">
                                                               <img src={assets.facebook_icon} alt="Facebook" />
                                                               <img src={assets.twitter_icon} alt="Twitter" />
                                                               <img src={assets.linkedin_icon} alt="LinkedIn" />
                                                      </div>
                                             </div>
                                    </div>
                           </div>

                           <div className="footer-bottom">
                                    <div className="footer-bottom-inner">
                                             <div className="footer-brand">
                                                      <img src={assets.logo} alt="TasteDrop" className="footer-logo" />
                                                      <span className="footer-brand-name">TasteDrop</span>
                                                      <span className="footer-copy">&copy; {year}</span>
                                             </div>

                                             <div className="footer-chooser-group">
                                                      <button className="footer-chooser">EN</button>
                                                      <button className="footer-chooser">USD</button>
                                                      <button className="footer-chooser">Your city</button>
                                             </div>
                                    </div>
                           </div>
                  </footer>
         );
};

export default Footer;
