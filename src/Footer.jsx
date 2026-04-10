import { Link } from "react-router-dom";
import logo from "./assets/logo.png";

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function Footer({ onAdminClick }) {
  return (
    <footer className="footer footer-rich">
      <div className="footer-inner">

        {/* Brand column */}
        <div className="footer-col footer-brand">
          <img src={logo} alt="Homecoming Ranch Logo" className="footer-logo" />
          <p className="footer-tagline">
            Regenerative ranch in Hocking Hills, Ohio.<br />
            Grass-fed beef &amp; pasture-raised meat,<br />
            farm-to-table direct from our land.
          </p>
          <a
            href="https://instagram.com/homecoming_ranch"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
          >
            <InstagramIcon />
            @homecoming_ranch
          </a>
        </div>

        {/* Nav column */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Explore</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/store">Store</Link></li>
            <li><Link to="/experiences">Experiences</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/store#wholesale">Wholesale &amp; Restaurants</Link></li>
          </ul>
        </div>

        {/* Contact column */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Get in Touch</h4>
          <ul className="footer-links">
            <li>
              <a href="mailto:homecomingranch@gmail.com">homecomingranch@gmail.com</a>
            </li>
            <li>
              <a href="https://instagram.com/homecoming_ranch" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <Link to="/experiences">Book a Farm Tour</Link>
            </li>
            <li>
              <Link to="/store">Join Waitlist</Link>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>© 2026 Homecoming Ranch · Hocking Hills, Ohio</p>
        <p className="footer-credit">
          Website by{" "}
          <a href="https://bartholomewdevelopment.com" target="_blank" rel="noopener noreferrer">
            Bartholomew Development LLC
          </a>
        </p>
        {onAdminClick && (
          <button
            onClick={onAdminClick}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.7rem",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
            }}
          >
            Support
          </button>
        )}
      </div>
    </footer>
  );
}
