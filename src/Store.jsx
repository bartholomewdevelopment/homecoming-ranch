import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import emailjs from "@emailjs/browser";
import logo from "./assets/logo.png";
import steaks from "./assets/steaks.png";
import ContactModal from "./ContactModal";

// US States for dropdown
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

function Store() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [products, setProducts] = useState([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderFormStatus, setOrderFormStatus] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryFormStatus, setInquiryFormStatus] = useState(null);

  useEffect(() => {
    emailjs.init("-FGqvzXuTYnZckP4F");
    fetchBooks();
    fetchProducts();
  }, []);

  const fetchBooks = async () => {
    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/getBooks"
        : "/api/books";

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success && data.books) {
        setBooks(data.books);
      }
    } catch (error) {
      console.error("Failed to fetch books:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/getProducts"
        : "/api/products";

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const meats = products.filter(p => p.category === "meat" && p.quantity > 0);
  const merchandise = products.filter(p => p.category === "merchandise" && p.quantity > 0);

  const openOrderModal = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setOrderFormStatus(null);
    setIsOrderModalOpen(true);
  };

  const closeModal = (modalSetter) => {
    modalSetter(false);
    setSelectedProduct(null);
    setOrderFormStatus(null);
  };

  // reCAPTCHA helper function
  const getRecaptchaToken = async (action) => {
    try {
      if (window.grecaptcha) {
        const token = await window.grecaptcha.execute('6LfhvD0sAAAAAJIwXSO7qe1l6LCaYgazEjGmOmS1', { action });
        return token;
      }
      console.warn('reCAPTCHA not loaded');
      return null;
    } catch (error) {
      console.warn('reCAPTCHA error:', error);
      return null;
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
      const recaptchaToken = await getRecaptchaToken('order_submit');

      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/submitOrder"
        : "/api/orders/submit";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName.value,
          lastName: form.lastName.value,
          email: form.email.value,
          phone: form.phone.value,
          address: form.address.value,
          city: form.city.value,
          state: form.state.value,
          zip: form.zip.value,
          productId: selectedProduct.id,
          quantity: orderQuantity,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit order");
      }

      setOrderFormStatus("success");
      form.reset();

      // Refresh products to update inventory display
      fetchProducts();

    } catch (error) {
      console.error("Order submission failed:", error);
      setOrderFormStatus("error");
    }
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const firstName = form.firstName.value;
    const lastName = form.lastName.value;
    const email = form.email.value;
    const phone = form.phone.value;
    const product = form.product.value;
    const referralSource = form.referralSource.value;
    const subscribedToNewsletter = form.newsletter.checked;
    const comments = form.comments.value;
    const newsletterValue = subscribedToNewsletter ? "Yes" : "No";
    form.newsletter.value = newsletterValue;

    try {
      const recaptchaToken = await getRecaptchaToken('buy_meat_submit');

      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/buyMeatSubmit"
        : "/api/buy-meat-submit";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          product,
          referralSource,
          subscribedToNewsletter,
          comments,
          recaptchaToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save to Google Sheets");
      }

      emailjs.sendForm("service_fftcjg1", "buy_meat_template", form)
        .catch((err) => console.warn("EmailJS failed (non-critical):", err));

      setInquiryFormStatus("success");
      form.reset();
    } catch (error) {
      console.error("Inquiry Form Failed...", error);
      setInquiryFormStatus("error");
    }
  };

  const calculateTotal = () => {
    if (!selectedProduct) return "0.00";
    return (selectedProduct.price * orderQuantity).toFixed(2);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header sticky">
        <div className="header-left">
          <img src={logo} alt="Homecoming Ranch Logo" className="logo" />
        </div>
        <div className="header-right">
          <button
            className="nav-toggle"
            onClick={() => setIsNavOpen(!isNavOpen)}
          >
            ☰
          </button>
          <nav className={`nav ${isNavOpen ? "open" : ""}`}>
            <Link to="/">Home</Link>
            <Link to="/store">Store</Link>
            <Link to="/experiences">Experiences</Link>
            <Link to="/about">About Us</Link>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                setIsContactModalOpen(true);
              }}
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Store Hero */}
      <section className="store-hero">
        <div className="store-hero-overlay"></div>
        <div className="store-hero-content">
          <span className="store-hero-badge">Regenerative Ranch</span>
          <h1>Homecoming Ranch Store</h1>
          <p>Premium grass-fed meats, family books, and ranch merchandise — straight from our land to you</p>
        </div>
      </section>

      {/* Books Section */}
      <section className="store-section books-section">
        <span className="section-badge">Reading</span>
        <h2>Books</h2>
        <p className="section-description">
          Explore the books written by the family of Homecoming Ranch
        </p>
        <div className="products-grid">
          {books.map((book) => (
            <a
              key={book.id}
              href={book.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="product-card book-card"
            >
              {book.imageUrl && (
                <img
                  src={book.imageUrl}
                  alt={book.title}
                  className="product-card-image"
                />
              )}
              <div className="product-card-content">
                <h3 className="product-card-title">{book.title}</h3>
                <p className="book-author">by {book.author}</p>
                <span className="cta-btn outline-btn">View Book →</span>
              </div>
            </a>
          ))}
          {books.length === 0 && (
            <p className="no-products">Books coming soon!</p>
          )}
        </div>
      </section>

      {/* Meats Section */}
      <section className="store-section meats-section">
        <span className="section-badge">Farm to Table</span>
        <h2>Farm Fresh Meats</h2>
        <p className="section-description">
          100% grass-fed and pasture-raised meats from our regenerative ranch
        </p>
        {meats.length > 0 ? (
          <div className="products-grid">
            {meats.map((meat) => (
              <div key={meat.id} className="product-card">
                {meat.imageUrl && (
                  <img
                    src={meat.imageUrl}
                    alt={meat.name}
                    className="product-card-image"
                  />
                )}
                <div className="product-card-content">
                  <h3 className="product-card-title">{meat.name}</h3>
                  {meat.description && (
                    <p className="product-card-description">{meat.description}</p>
                  )}
                  <p className="product-card-price">
                    ${meat.price.toFixed(2)}/{meat.unit}
                  </p>
                  <p className="product-card-quantity">
                    {meat.quantity} {meat.unit}s available
                  </p>
                  <button
                    className="cta-btn primary-btn"
                    onClick={() => openOrderModal(meat)}
                  >
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products-container">
            <p className="no-products">
              No meats currently available. Sign up to be notified when new inventory arrives!
            </p>
            <button
              className="cta-btn outline-btn"
              onClick={() => setIsInquiryModalOpen(true)}
            >
              Join Waitlist
            </button>
          </div>
        )}
      </section>

      {/* Merchandise Section */}
      <section className="store-section merch-section">
        <span className="section-badge">Ranch Gear</span>
        <h2>Merchandise</h2>
        <p className="section-description">
          Show your support for regenerative ranching with our ranch gear
        </p>
        {merchandise.length > 0 ? (
          <div className="products-grid">
            {merchandise.map((item) => (
              <div key={item.id} className="product-card">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="product-card-image"
                  />
                )}
                <div className="product-card-content">
                  <h3 className="product-card-title">{item.name}</h3>
                  {item.description && (
                    <p className="product-card-description">{item.description}</p>
                  )}
                  <p className="product-card-price">
                    ${item.price.toFixed(2)}
                  </p>
                  <p className="product-card-quantity">
                    {item.quantity} available
                  </p>
                  <button
                    className="cta-btn primary-btn"
                    onClick={() => openOrderModal(item)}
                  >
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-products">Merchandise coming soon!</p>
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <img src={logo} alt="Homecoming Ranch Logo" className="logo" />
        <p>© 2025 Homecoming Ranch.</p>
        <p>
          Website Built by{" "}
          <a
            href="https://bartholomewdevelopment.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bartholomew Development LLC
          </a>{" "}
          |{" "}
          <a href="mailto:inquiries@bartholomewdevelopment.com">
            inquiries@bartholomewdevelopment.com
          </a>
        </p>
        <a
          href="https://instagram.com/homecoming_ranch"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="instagram-icon">
            📸 Follow Homecoming Ranch's journey!
          </span>
        </a>
      </footer>

      {/* Order Modal */}
      {isOrderModalOpen && selectedProduct && (
        <div
          className="modal-overlay"
          onClick={() => closeModal(setIsOrderModalOpen)}
        >
          <div
            className="modal-content order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selectedProduct.imageUrl || steaks} alt={selectedProduct.name} className="modal-image" />
            <h2>Order {selectedProduct.name}</h2>

            <div className="order-product-info">
              <p>
                <strong>Price:</strong> ${selectedProduct.price.toFixed(2)}/{selectedProduct.unit}
              </p>
              <p>
                <strong>Available:</strong> {selectedProduct.quantity} {selectedProduct.unit}
                {selectedProduct.quantity !== 1 ? "s" : ""}
              </p>
            </div>

            {orderFormStatus === "success" && (
              <div className="success-message">
                <p>Order submitted successfully!</p>
                <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
                  We will contact you soon to arrange payment and delivery.
                </p>
              </div>
            )}
            {orderFormStatus === "error" && (
              <p className="error-message">
                Failed to submit order. Please try again.
              </p>
            )}

            {orderFormStatus !== "success" && (
              <form className="buy-meat-form" onSubmit={handleOrderSubmit}>
                <h3>Shipping Information</h3>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  required
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Street Address"
                  required
                />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  required
                />
                <select name="state" required>
                  <option value="">Select State</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="zip"
                  placeholder="ZIP Code"
                  required
                />

                <h3>Contact Information</h3>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  required
                />

                <h3>Order Details</h3>
                <div className="quantity-selector">
                  <label htmlFor="quantity">
                    Quantity ({selectedProduct.unit}s):
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    max={selectedProduct.quantity}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Math.min(
                      Math.max(1, parseInt(e.target.value) || 1),
                      selectedProduct.quantity
                    ))}
                    required
                  />
                </div>

                <div className="order-total">
                  <strong>Total: ${calculateTotal()}</strong>
                </div>

                <button type="submit" className="cta-btn primary-btn">
                  Place Order
                </button>
              </form>
            )}

            <button
              className="modal-close"
              onClick={() => closeModal(setIsOrderModalOpen)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Inquiry/Waitlist Modal */}
      {isInquiryModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsInquiryModalOpen(false);
            setInquiryFormStatus(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={steaks} alt="Steaks" className="modal-image" />
            <h2>Join Our Waitlist</h2>
            <p className="modal-subtitle">
              Be the first to know when our premium meats become available!
            </p>
            {inquiryFormStatus === "success" && (
              <p className="success-message">
                You're on the list! We'll notify you when meat is available.
              </p>
            )}
            {inquiryFormStatus === "error" && (
              <p className="error-message">
                Failed to submit form. Please try again.
              </p>
            )}
            {inquiryFormStatus !== "success" && (
              <form className="buy-meat-form" onSubmit={handleInquirySubmit}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  required
                />
                <input type="email" name="email" placeholder="Email" required />
                <input type="tel" name="phone" placeholder="Phone" required />
                <select name="product" required>
                  <option value="">Which Product Are You Interested In?</option>
                  <option value="highland-beef">Highland Beef</option>
                  <option value="dexter-beef">Dexter Beef</option>
                  <option value="chevon">Chevon (Goat Meat)</option>
                  <option value="turkey">Turkey (Seasonal)</option>
                  <option value="chicken">Chicken (Seasonal)</option>
                </select>
                <select name="referralSource" required>
                  <option value="">How Did You Hear About Us?</option>
                  <option value="friends-family">Friends/Family</option>
                  <option value="referral">Referral</option>
                  <option value="instagram">Instagram</option>
                  <option value="google-search">Google Search</option>
                </select>
                <label>
                  <input type="checkbox" name="newsletter" /> Subscribe to
                  Newsletter
                </label>
                <textarea
                  name="comments"
                  placeholder="Comments"
                  rows="4"
                ></textarea>
                <button type="submit" className="cta-btn primary-btn">
                  Join Waitlist
                </button>
              </form>
            )}
            <button
              className="modal-close"
              onClick={() => {
                setIsInquiryModalOpen(false);
                setInquiryFormStatus(null);
              }}
            >
              ×
            </button>
            <button
              className="cta-btn outline-btn modal-close-bottom"
              onClick={() => {
                setIsInquiryModalOpen(false);
                setInquiryFormStatus(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Store;
