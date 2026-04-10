import { useState, useEffect } from "react";
import ContactModal from "./ContactModal";
import { Link } from "react-router-dom";
import "./App.css";
import emailjs from "@emailjs/browser";
import logo from "./assets/logo.png";
import heroImage from "./assets/herd.png";
import cattleImage from "./assets/cattle.jpg";
import steaks from "./assets/steaks.png";
import eggs from "./assets/eggs.png";

function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isBuyMeatModalOpen, setIsBuyMeatModalOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isLearnMoreExpanded, setIsLearnMoreExpanded] = useState(false);
  const [isLivestockModalOpen, setIsLivestockModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedLivestock, setSelectedLivestock] = useState(null);
  const [buyMeatFormStatus, setBuyMeatFormStatus] = useState(null);
  const [recipeFormStatus, setRecipeFormStatus] = useState(null);
  const [showStickyBanner, setShowStickyBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bannerFormStatus, setBannerFormStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    time: "",
    type: "Ranch Tour",
  });
  // Store admin state
  const [adminActiveTab, setAdminActiveTab] = useState("events");
  const [products, setProducts] = useState([]);
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newProduct, setNewProduct] = useState({
    category: "meat",
    name: "",
    description: "",
    price: "",
    quantity: "",
    unit: "lb",
    imageUrl: "",
  });
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    externalUrl: "",
    imageUrl: "",
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [isEventSignupModalOpen, setIsEventSignupModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventSignupFormStatus, setEventSignupFormStatus] = useState(null);

  useEffect(() => {
    emailjs.init("-FGqvzXuTYnZckP4F");

    // Fetch events from backend
    const fetchEvents = async () => {
      try {
        const apiUrl = import.meta.env.DEV
          ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/getEvents"
          : "/api/events";

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.success && data.events) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };

    fetchEvents();

    // Fetch products to check meat availability for store button
    const fetchProductsForStock = async () => {
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

    fetchProductsForStock();

    // Admin access via URL hash — navigate to /#admin-access to open panel
    if (window.location.hash === "#admin-access") {
      setIsAdminModalOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setShowStickyBanner(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const livestockInfo = {
    cows: {
      title: "Highland Cows",
      content: (
        <>
          <p>
            The Scottish Highland breed produces meat that is considered premium
            beef because of the lean, marbled flesh that results in tender,
            flavorful cuts. A slow-maturing breed, calves are not butchered
            until they reach 24 to 30 months. While this results in a slow turn
            around, it contributes to the tenderness and succulent taste of the
            meat. Research in the US and UK also suggests that Highland beef is
            healthier than other types of beef, being lower in fat and
            cholesterol and higher in iron and protein.
          </p>
          <p>
            While Scottish Highland cattle are recognizable by their shaggy hair
            and bangs, there are several advantages to raising them that might
            not be so well known. The cows are notable for their good mothering
            and protective natures, and the breed is hardy and resilient and
            able to thrive on very low input from the breeder. Originating in
            the Scottish Highlands and coastal islands, they are able to adapt
            to rough terrain and different climates. They are also good foragers
            and often used to clean up and improve poor pastures, thriving and
            converting feed to beef in conditions considered unsuitable for
            other breeds.
          </p>
        </>
      ),
    },
    dexterCows: {
      title: "Dexter Cows",
      content: (
        <>
          <p>
            Grass-fed Dexter beef is a premium choice known for its rich flavor,
            tenderness, and sustainable production. Originating in Ireland,
            Dexter cattle are a small, efficient breed raised primarily on
            pasture using traditional, ethical farming practices. Their smaller
            size allows for efficient grazing, lower environmental impact, and
            excellent feed-to-meat conversion.
          </p>
          <p>
            Dexter beef is prized for its fine marbling, slightly sweet and
            robust flavor, and balanced fat-to-meat ratio—offering richness
            without excessive heaviness. Nutritionally, it provides high-quality
            protein, beneficial omega-3 and omega-6 fatty acids, and essential
            vitamins and minerals such as iron, zinc, and B vitamins.
          </p>
          <p>
            Popular among chefs and home cooks alike, Dexter beef excels across
            cuts—from ribeye and striploin to brisket and ground beef—and
            performs well with grilling, pan-searing, or slow cooking. Choosing
            Dexter beef means enjoying exceptional taste while supporting
            sustainable, humane farming.
          </p>
        </>
      ),
    },
    goats: {
      title: "Goats",
      content: (
        <>
          <p>
            Goat meat is one of the most widely consumed meats worldwide and
            arguably the healthiest meat option available. While high in protein
            and iron, it has fewer calories than other meat, including beef,
            lamb, and pork, and less fat than any other meat, including chicken!
            In addition to the health benefits, goat meat, or chevon, is a
            tender, lean meat with a savory taste. It can be prepared multiple
            ways, including grilled, roasted, stewed, curried, barbecued, or
            made into sausage or bratwurst.
          </p>
          <p>
            Our goats are mostly hybrids of meat breeds such as Spanish, Kiko,
            Savanah, and Boer. Most meat breeds are specifically bred to produce
            heavily muscled goats, while Spanish varieties are particularly
            hardy, well-adapted survivors. At Homecoming Ranch, our goal is to
            breed a commercial goat that is perfectly adapted to forage and
            thrive on the local terrain so we can offer healthy meat to
            customers and excellent breeding stock to local farmers.
          </p>
        </>
      ),
    },
    poultry: {
      title: "Poultry (Seasonal)",
      content: (
        <>
          <p>
            Our pasture raised poultry is raised regeneratively with access to
            fresh pasture, sunlight, and a natural diet supplemented with
            non-GMO feed. This produces juicy, flavorful meat that's higher in
            Omega-3 fatty acids and vitamins compared to conventional poultry.
            Available seasonally, typically in spring and fall.
          </p>
          <p>
            Our chickens and turkeys roam freely in mobile coops that we rotate
            across the pastures, allowing them to scratch, peck, and fertilize
            the soil naturally. This practice enhances soil microbiology while
            ensuring our poultry live healthy, stress-free lives, resulting in
            superior meat quality.
          </p>
        </>
      ),
    },
  };

  const closeModal = (modalSetter) => {
    modalSetter(false);
    setSelectedLivestock(null);
    setBuyMeatFormStatus(null);
    setRecipeFormStatus(null);
  };

  const handleBannerRecipeSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const firstName = form.firstName.value;
    const email = form.email.value;

    try {
      await emailjs.sendForm(
        "service_fftcjg1",
        "template_recipebooksent",
        form,
      );

      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/recipeSignup"
        : "/api/recipe-signup";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email,
          subscribedToNewsletter: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to save to Google Sheets");

      setBannerFormStatus("success");
      form.reset();
    } catch (error) {
      console.error("Banner Recipe Form Failed...", error);
      setBannerFormStatus("error");
    }
  };

  const openLivestockModal = (type) => {
    setSelectedLivestock(type);
    setIsLivestockModalOpen(true);
  };

  // reCAPTCHA helper function
  const getRecaptchaToken = async (action) => {
    try {
      if (window.grecaptcha) {
        const token = await window.grecaptcha.execute(
          "6LfhvD0sAAAAAJIwXSO7qe1l6LCaYgazEjGmOmS1",
          { action },
        );
        return token;
      }
      console.warn("reCAPTCHA not loaded");
      return null;
    } catch (error) {
      console.warn("reCAPTCHA error:", error);
      return null;
    }
  };

  const handleBuyMeatSubmit = async (e) => {
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
      // Get reCAPTCHA token
      const recaptchaToken = await getRecaptchaToken("buy_meat_submit");

      // Send to Google Sheets backend (Cloud Function) - PRIMARY
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

      // Send to EmailJS (secondary, non-blocking)
      emailjs
        .sendForm("service_fftcjg1", "buy_meat_template", form)
        .catch((err) => console.warn("EmailJS failed (non-critical):", err));

      setBuyMeatFormStatus("success");
      form.reset();
    } catch (error) {
      console.error("Buy Meat Form Failed...", error);
      setBuyMeatFormStatus("error");
    }
  };

  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const firstName = form.firstName.value;
    const email = form.email.value;
    const subscribedToNewsletter = form.newsletter.checked;
    const newsletterValue = subscribedToNewsletter ? "Yes" : "No";
    form.newsletter.value = newsletterValue;

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getRecaptchaToken("recipe_submit");

      // Send to Google Sheets backend (Cloud Function) - PRIMARY
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/recipeSignup"
        : "/api/recipe-signup";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          email,
          subscribedToNewsletter,
          recaptchaToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save to Google Sheets");
      }

      // Send to EmailJS (secondary, non-blocking)
      emailjs
        .sendForm("service_fftcjg1", "template_recipebooksent", form)
        .catch((err) => console.warn("EmailJS failed (non-critical):", err));

      setRecipeFormStatus("success");
      form.reset();
    } catch (error) {
      console.error("Recipe Form Failed...", error);
      setRecipeFormStatus("error");
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === "HomecomingRanch2026!Secure") {
      setIsAdminAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();

    // Check if admin is authenticated (password entered)
    if (!isAdminAuthenticated) {
      alert("Please log in as admin first");
      return;
    }

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/addEvent"
        : "/api/events/add";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newEvent,
          password: adminPassword, // Include admin password in request
        }),
      });

      const data = await response.json();

      if (data.success && data.event) {
        // Add the new event to the state
        setEvents([...events, data.event]);
        setNewEvent({ name: "", date: "", time: "", type: "Ranch Tour" });
      } else {
        alert(`Failed to add event: ${data.error || "Unknown error"}`);
        console.error("Add event failed:", data.error);
      }
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Failed to add event. Please try again.");
    }
  };

  const handleDeleteEvent = async (id) => {
    // Check if admin is authenticated (password entered)
    if (!isAdminAuthenticated) {
      alert("Please log in as admin first");
      return;
    }

    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/deleteEvent"
        : "/api/events/delete";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          password: adminPassword, // Include admin password in request
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove the event from the state
        setEvents(events.filter((event) => event.id !== id));
      } else {
        alert(`Failed to delete event: ${data.error || "Unknown error"}`);
        console.error("Delete event failed:", data.error);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    }
  };

  // ========== STORE ADMIN FUNCTIONS ==========

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

  const fetchOrders = async () => {
    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/getOrders"
        : "/api/orders";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const data = await response.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      alert("Please log in as admin first");
      return;
    }

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/addProduct"
        : "/api/products/add";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          quantity: parseFloat(newProduct.quantity),
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (data.success && data.product) {
        setProducts([...products, data.product]);
        setNewProduct({
          category: newProduct.category,
          name: "",
          description: "",
          price: "",
          quantity: "",
          unit: newProduct.category === "meat" ? "lb" : "item",
          imageUrl: "",
        });
      } else {
        alert(`Failed to add product: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product. Please try again.");
    }
  };

  const handleUpdateProduct = async (id, updates) => {
    if (!isAdminAuthenticated) {
      alert("Please log in as admin first");
      return;
    }

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/updateProduct"
        : "/api/products/update";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...updates,
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (data.success && data.product) {
        setProducts(products.map((p) => (p.id === id ? data.product : p)));
        setEditingProduct(null);
      } else {
        alert(`Failed to update product: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product. Please try again.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!isAdminAuthenticated) {
      alert("Please log in as admin first");
      return;
    }

    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/deleteProduct"
        : "/api/products/delete";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password: adminPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert(`Failed to delete product: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      alert("Please log in as admin first");
      return;
    }

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/addBook"
        : "/api/books/add";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBook,
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (data.success && data.book) {
        setBooks([...books, data.book]);
        setNewBook({ title: "", author: "", externalUrl: "", imageUrl: "" });
      } else {
        alert(`Failed to add book: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding book:", error);
      alert("Failed to add book. Please try again.");
    }
  };

  const handleUpdateBook = async (id, updates) => {
    if (!isAdminAuthenticated) {
      alert("Please log in as admin first");
      return;
    }

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/updateBook"
        : "/api/books/update";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...updates,
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (data.success && data.book) {
        setBooks(books.map((b) => (b.id === id ? data.book : b)));
        setEditingBook(null);
      } else {
        alert(`Failed to update book: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating book:", error);
      alert("Failed to update book. Please try again.");
    }
  };

  const handleDeleteBook = async (id) => {
    if (!isAdminAuthenticated) {
      alert("Please log in as admin first");
      return;
    }

    if (!confirm("Are you sure you want to delete this book?")) {
      return;
    }

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/deleteBook"
        : "/api/books/delete";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password: adminPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setBooks(books.filter((b) => b.id !== id));
      } else {
        alert(`Failed to delete book: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Failed to delete book. Please try again.");
    }
  };

  const openEventSignupModal = (event) => {
    setSelectedEvent(event);
    setEventSignupFormStatus(null);
    setIsEventSignupModalOpen(true);
  };

  const closeEventSignupModal = () => {
    setIsEventSignupModalOpen(false);
    setSelectedEvent(null);
    setEventSignupFormStatus(null);
  };

  const handleEventSignupSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const phone = form.phone?.value || "";
    const message = form.message?.value || "";

    // Get current time for submission timestamp
    const now = new Date();
    const submissionTime = now.toLocaleString();

    // Build message with contact info
    const fullMessage = `Email: ${email}${phone ? `\nPhone: ${phone}` : ""}${message ? `\n\nMessage: ${message}` : ""}`;

    try {
      // Send to EmailJS
      await emailjs.send("service_fftcjg1", "template_n2joi5n", {
        name: name,
        time: submissionTime,
        message: fullMessage,
        event: selectedEvent.name,
        eventdate: selectedEvent.date,
        eventtime: selectedEvent.time,
      });

      setEventSignupFormStatus("success");
      form.reset();
    } catch (error) {
      console.error("Event Signup Failed...", error);
      setEventSignupFormStatus("error");
    }
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
            <a href="#home">Home</a>
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

      {/* Hero Section */}
      <section
        id="home"
        className="hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title animate-slide-in">Homecoming Ranch</h1>
          <h2 className="hero-subtitle animate-fade-in">
            Regenerative Ranching for a <br />
            Healthier Planet &amp; Community
          </h2>
          <p className="animate-fade-in">
            Grass-fed beef & goat meat, sustainably farmed in Hocking Hills,
            Ohio.
          </p>
          <div className="cta-buttons animate-slide-up">
            <button
              className="cta-btn primary-btn"
              onClick={() => setIsBuyMeatModalOpen(true)}
            >
              Buy Meat
            </button>
            <div className="cta-secondary-group">
              <button
                className="cta-btn outline-btn secondary-btn"
                onClick={() => setIsEventsModalOpen(true)}
              >
                Schedule a Tour
              </button>
              <button
                className="cta-btn outline-btn secondary-btn"
                onClick={() => setIsRecipeModalOpen(true)}
              >
                Free Recipe Book
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Livestock Section */}
      <section
        id="buy-meat"
        className="livestock animate-section"
        style={{ backgroundImage: `url(${cattleImage})` }}
      >
        <div className="livestock-overlay"></div>
        <div className="livestock-content">
          <div className="livestock-top">
            <h2>Our Regeneratively-Raised Livestock</h2>
            <div className="livestock-grid">
              <div
                className="livestock-item"
                onClick={() => openLivestockModal("cows")}
              >
                <h3>Highland Cows</h3>
                <p>
                  100% Grass-Fed & Grass-Finished. Superior nutrition with
                  higher Omega-3s.
                </p>
                <span className="livestock-item-cta">Learn more ›</span>
              </div>
              <div
                className="livestock-item"
                onClick={() => openLivestockModal("dexterCows")}
              >
                <h3>Dexter Cows</h3>
                <p>
                  100% Grass-Fed & Grass-Finished beef with rich flavor and
                  sustainable production.
                </p>
                <span className="livestock-item-cta">Learn more ›</span>
              </div>
              <div
                className="livestock-item"
                onClick={() => openLivestockModal("goats")}
              >
                <h3>Goats</h3>
                <p>
                  Pasture-raised on natural forage. Lean, high-protein meat.
                </p>
                <span className="livestock-item-cta">Learn more ›</span>
              </div>
              <div
                className="livestock-item"
                onClick={() => openLivestockModal("poultry")}
              >
                <h3>Poultry</h3>
                <p>
                  Pasture-raised, regeneratively raised. Juicy, high-quality
                  meat.
                </p>
                <span className="livestock-item-cta">Learn more ›</span>
              </div>
            </div>
          </div>
          <div className="livestock-bottom">
            <div className="livestock-buttons">
              <button
                className="cta-btn outline-btn"
                onClick={() => setIsBuyMeatModalOpen(true)}
              >
                Join Waitlist
              </button>
              {products.filter((p) => p.category === "meat" && p.quantity > 0)
                .length > 0 && (
                <Link to="/store" className="cta-btn primary-btn">
                  Buy Meat
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What is Regenerative Ranching */}
      <section
        className="regenerative-info animate-section"
        style={{ "--logo-url": `url(${logo})` }}
      >
        <h2>What is Regenerative Ranching?</h2>
        <p className="regen-subtitle">
          Beyond sustainable — restoring the land while raising healthy animals.
        </p>
        <div className="regen-grid">
          <div className="regen-card">
            <span className="regen-card-icon" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#15803D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </span>
            <h3 className="regen-card-title">Soil Restoration</h3>
            <p className="regen-card-desc">
              Rotational grazing rebuilds soil nutrients and microorganisms,
              naturally improving water retention and land health.
            </p>
          </div>
          <div className="regen-card">
            <span className="regen-card-icon" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#15803D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            </span>
            <h3 className="regen-card-title">Biodiversity</h3>
            <p className="regen-card-desc">
              Natural grazing cycles support a rich ecosystem of plants,
              insects, and wildlife across our 98 Appalachian acres.
            </p>
          </div>
          <div className="regen-card">
            <span className="regen-card-icon" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#15803D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
                <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
                <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
              </svg>
            </span>
            <h3 className="regen-card-title">Carbon Capture</h3>
            <p className="regen-card-desc">
              Healthy, living soil sequesters carbon from the atmosphere —
              turning our pastures into a net climate benefit.
            </p>
          </div>
          <div className="regen-card">
            <span className="regen-card-icon" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#15803D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </span>
            <h3 className="regen-card-title">Nutrient-Dense Meat</h3>
            <p className="regen-card-desc">
              Pasture-raised animals produce meat higher in Omega-3s, vitamins,
              and minerals than conventionally raised livestock.
            </p>
          </div>
        </div>
        <p className="regen-tagline">
          At Homecoming Ranch, we rebuild ecosystems.
        </p>
        <button
          className="regen-learn-trigger"
          onClick={() => setIsLearnMoreExpanded(!isLearnMoreExpanded)}
        >
          <span>
            {isLearnMoreExpanded
              ? "Show less about our practices"
              : "Dive deeper into our practices"}
          </span>
          <span
            className={`regen-chevron${isLearnMoreExpanded ? " open" : ""}`}
          >
            ▼
          </span>
        </button>
        {isLearnMoreExpanded && (
          <div className="learn-more-content">
            <p>
              Regenerative ranching is a holistic approach to farming that goes
              beyond sustainability. It focuses on rebuilding soil health,
              enhancing biodiversity, and sequestering carbon while producing
              nutrient-dense food. At Homecoming Ranch, we use rotational
              grazing to mimic natural herd movements, allowing pastures to
              recover and thrive. This method improves water retention, reduces
              erosion, and supports a diverse ecosystem of plants, insects, and
              wildlife.
            </p>
            <p>
              Our practices result in healthier livestock—cows, goats, and
              more—that produce meat with higher levels of Omega-3 fatty acids,
              vitamins, and minerals. By choosing regenerative products, you're
              not just eating better; you're supporting a system that heals the
              planet. Learn more about our mission to restore 98 acres of
              Hocking Hills Ohio into a model of sustainable agriculture!
            </p>
            <div className="video-container">
              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/4R7mX6pChSA?si=Mgak409vqHvpEXPx"
                title="YouTube video player"
                style={{ border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          </div>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: "0.4em",
              }}
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
            Follow Homecoming Ranch's journey
          </span>
        </a>
        <button
          className="cta-btn outline-btn admin-panel-btn"
          onClick={() => setIsAdminModalOpen(true)}
          style={{ display: "none" }}
        >
          Admin Panel
        </button>
      </footer>

      {/* Modals */}
      {isBuyMeatModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => closeModal(setIsBuyMeatModalOpen)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={steaks} alt="Steaks" className="modal-image" />
            <h2>Inquire About Our Products</h2>
            {buyMeatFormStatus === "success" && (
              <p className="success-message">
                Form submitted successfully! We'll get back to you soon.
              </p>
            )}
            {buyMeatFormStatus === "error" && (
              <p className="error-message">
                Failed to submit form. Please try again.
              </p>
            )}
            <form className="buy-meat-form" onSubmit={handleBuyMeatSubmit}>
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
                <option value="">Which Product Are You Inquiring About?</option>
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
                Submit
              </button>
            </form>
            <button
              className="modal-close"
              onClick={() => closeModal(setIsBuyMeatModalOpen)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isEventsModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => closeModal(setIsEventsModalOpen)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={eggs} alt="Events" className="modal-image" />
            <h2>Upcoming Events & Ranch Tours</h2>
            <p>
              Join us for educational workshops, guided ranch tours, and
              hands-on farm activities!
            </p>
            <div className="events-list">
              {events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="event-item public-event">
                    <div className="event-details">
                      <h3>{event.name}</h3>
                      <p>
                        <strong>Date:</strong> {event.date}
                      </p>
                      <p>
                        <strong>Time:</strong> {event.time}
                      </p>
                      <p>
                        <strong>Type:</strong> {event.type}
                      </p>
                      <button
                        className="cta-btn primary-btn event-signup-btn"
                        onClick={() => openEventSignupModal(event)}
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-events">2026 Events Coming Soon</p>
              )}
            </div>
            <button
              className="modal-close"
              onClick={() => closeModal(setIsEventsModalOpen)}
            >
              ×
            </button>
            <button
              className="cta-btn outline-btn modal-close-bottom"
              onClick={() => closeModal(setIsEventsModalOpen)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isLivestockModalOpen && selectedLivestock && (
        <div
          className="modal-overlay"
          onClick={() => closeModal(setIsLivestockModalOpen)}
        >
          <div
            className="modal-content livestock-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{livestockInfo[selectedLivestock].title}</h2>
            {livestockInfo[selectedLivestock].content}
            <button
              className="modal-close"
              onClick={() => closeModal(setIsLivestockModalOpen)}
            >
              ×
            </button>
            <div className="modal-buttons">
              <button
                className="cta-btn primary-btn"
                onClick={() => {
                  setIsBuyMeatModalOpen(true);
                  setIsLivestockModalOpen(false);
                }}
              >
                Buy Meat
              </button>
              <button
                className="cta-btn outline-btn"
                onClick={() => closeModal(setIsLivestockModalOpen)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {isAdminModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => closeModal(setIsAdminModalOpen)}
        >
          <div
            className="modal-content admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Admin Panel</h2>
            {!isAdminAuthenticated ? (
              <div className="admin-login">
                <p>Please enter the admin password to manage the store.</p>
                <form className="buy-meat-form" onSubmit={handleAdminLogin}>
                  <input
                    type="password"
                    placeholder="Enter Admin Password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                  <button type="submit" className="cta-btn primary-btn">
                    Login
                  </button>
                </form>
              </div>
            ) : (
              <div className="admin-authenticated">
                {/* Admin Tabs */}
                <div className="admin-tabs">
                  <button
                    className={`admin-tab ${adminActiveTab === "events" ? "active" : ""}`}
                    onClick={() => setAdminActiveTab("events")}
                  >
                    Events
                  </button>
                  <button
                    className={`admin-tab ${adminActiveTab === "meats" ? "active" : ""}`}
                    onClick={() => {
                      setAdminActiveTab("meats");
                      fetchProducts();
                    }}
                  >
                    Meats
                  </button>
                  <button
                    className={`admin-tab ${adminActiveTab === "merchandise" ? "active" : ""}`}
                    onClick={() => {
                      setAdminActiveTab("merchandise");
                      fetchProducts();
                    }}
                  >
                    Merchandise
                  </button>
                  <button
                    className={`admin-tab ${adminActiveTab === "books" ? "active" : ""}`}
                    onClick={() => {
                      setAdminActiveTab("books");
                      fetchBooks();
                    }}
                  >
                    Books
                  </button>
                  <button
                    className={`admin-tab ${adminActiveTab === "orders" ? "active" : ""}`}
                    onClick={() => {
                      setAdminActiveTab("orders");
                      fetchOrders();
                    }}
                  >
                    Orders
                  </button>
                </div>

                {/* Events Tab */}
                {adminActiveTab === "events" && (
                  <>
                    <div className="admin-section">
                      <h3>Add New Event</h3>
                      <form className="buy-meat-form" onSubmit={handleAddEvent}>
                        <input
                          type="text"
                          placeholder="Event Name"
                          value={newEvent.name}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, name: e.target.value })
                          }
                          required
                        />
                        <input
                          type="date"
                          value={newEvent.date}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, date: e.target.value })
                          }
                          required
                        />
                        <input
                          type="text"
                          placeholder="Time (e.g., 9:00 AM - 12:00 PM)"
                          value={newEvent.time}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, time: e.target.value })
                          }
                          required
                        />
                        <select
                          value={newEvent.type}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, type: e.target.value })
                          }
                          required
                        >
                          <option value="Ranch Tour">Ranch Tour</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Seminar">Seminar</option>
                          <option value="Activity">Activity</option>
                        </select>
                        <button type="submit" className="cta-btn primary-btn">
                          Add Event
                        </button>
                      </form>
                    </div>

                    <div className="admin-section">
                      <h3>Current Events</h3>
                      <div className="events-list admin-events-list">
                        {events.length > 0 ? (
                          events.map((event) => (
                            <div
                              key={event.id}
                              className="event-item admin-event-item"
                            >
                              <div className="event-info">
                                <strong>{event.name}</strong>
                                <span>
                                  {event.date} • {event.time}
                                </span>
                                <span className="event-type-badge">
                                  {event.type}
                                </span>
                              </div>
                              <button
                                className="cta-btn delete-btn"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                Delete
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="no-events">
                            No events yet. Add one above!
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Meats Tab */}
                {adminActiveTab === "meats" && (
                  <>
                    <div className="admin-section">
                      <h3>Add New Meat Product</h3>
                      <form
                        className="buy-meat-form"
                        onSubmit={handleAddProduct}
                      >
                        <input type="hidden" value="meat" />
                        <input
                          type="text"
                          placeholder="Product Name (e.g., Highland Beef)"
                          value={
                            newProduct.category === "meat"
                              ? newProduct.name
                              : ""
                          }
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              category: "meat",
                              name: e.target.value,
                              unit: "lb",
                            })
                          }
                          required
                        />
                        <textarea
                          placeholder="Description"
                          value={
                            newProduct.category === "meat"
                              ? newProduct.description
                              : ""
                          }
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              description: e.target.value,
                            })
                          }
                          rows="2"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price per lb ($)"
                          value={
                            newProduct.category === "meat"
                              ? newProduct.price
                              : ""
                          }
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              price: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Available Quantity (lbs)"
                          value={
                            newProduct.category === "meat"
                              ? newProduct.quantity
                              : ""
                          }
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              quantity: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={
                            newProduct.category === "meat"
                              ? newProduct.imageUrl
                              : ""
                          }
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              imageUrl: e.target.value,
                            })
                          }
                        />
                        <button type="submit" className="cta-btn primary-btn">
                          Add Meat Product
                        </button>
                      </form>
                    </div>

                    <div className="admin-section">
                      <h3>Current Meat Products</h3>
                      <div className="events-list admin-events-list">
                        {products.filter((p) => p.category === "meat").length >
                        0 ? (
                          products
                            .filter((p) => p.category === "meat")
                            .map((product) => (
                              <div
                                key={product.id}
                                className="event-item admin-event-item"
                              >
                                {editingProduct === product.id ? (
                                  <div className="edit-product-form">
                                    <input
                                      type="number"
                                      step="0.1"
                                      placeholder="Quantity"
                                      defaultValue={product.quantity}
                                      id={`qty-${product.id}`}
                                    />
                                    <button
                                      className="cta-btn primary-btn"
                                      onClick={() => {
                                        const qty = document.getElementById(
                                          `qty-${product.id}`,
                                        ).value;
                                        handleUpdateProduct(product.id, {
                                          quantity: parseFloat(qty),
                                        });
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      className="cta-btn outline-btn"
                                      onClick={() => setEditingProduct(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="event-info">
                                      <strong>{product.name}</strong>
                                      <span>
                                        ${product.price}/{product.unit} •{" "}
                                        {product.quantity} {product.unit}s
                                        available
                                      </span>
                                    </div>
                                    <div className="admin-product-actions">
                                      <button
                                        className="cta-btn edit-btn"
                                        onClick={() =>
                                          setEditingProduct(product.id)
                                        }
                                      >
                                        Edit Qty
                                      </button>
                                      <button
                                        className="cta-btn delete-btn"
                                        onClick={() =>
                                          handleDeleteProduct(product.id)
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))
                        ) : (
                          <p className="no-events">
                            No meat products yet. Add one above!
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Merchandise Tab */}
                {adminActiveTab === "merchandise" && (
                  <>
                    <div className="admin-section">
                      <h3>Add New Merchandise</h3>
                      <form
                        className="buy-meat-form"
                        onSubmit={handleAddProduct}
                      >
                        <input
                          type="text"
                          placeholder="Product Name (e.g., Ranch T-Shirt)"
                          value={
                            newProduct.category === "merchandise"
                              ? newProduct.name
                              : ""
                          }
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              category: "merchandise",
                              name: e.target.value,
                              unit: "item",
                            })
                          }
                          required
                        />
                        <textarea
                          placeholder="Description"
                          value={
                            newProduct.category === "merchandise"
                              ? newProduct.description
                              : ""
                          }
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              description: e.target.value,
                            })
                          }
                          rows="2"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price ($)"
                          value={
                            newProduct.category === "merchandise"
                              ? newProduct.price
                              : ""
                          }
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              price: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="number"
                          placeholder="Available Quantity"
                          value={
                            newProduct.category === "merchandise"
                              ? newProduct.quantity
                              : ""
                          }
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              quantity: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={
                            newProduct.category === "merchandise"
                              ? newProduct.imageUrl
                              : ""
                          }
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              imageUrl: e.target.value,
                            })
                          }
                        />
                        <button type="submit" className="cta-btn primary-btn">
                          Add Merchandise
                        </button>
                      </form>
                    </div>

                    <div className="admin-section">
                      <h3>Current Merchandise</h3>
                      <div className="events-list admin-events-list">
                        {products.filter((p) => p.category === "merchandise")
                          .length > 0 ? (
                          products
                            .filter((p) => p.category === "merchandise")
                            .map((product) => (
                              <div
                                key={product.id}
                                className="event-item admin-event-item"
                              >
                                {editingProduct === product.id ? (
                                  <div className="edit-product-form">
                                    <input
                                      type="number"
                                      placeholder="Quantity"
                                      defaultValue={product.quantity}
                                      id={`qty-${product.id}`}
                                    />
                                    <button
                                      className="cta-btn primary-btn"
                                      onClick={() => {
                                        const qty = document.getElementById(
                                          `qty-${product.id}`,
                                        ).value;
                                        handleUpdateProduct(product.id, {
                                          quantity: parseFloat(qty),
                                        });
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      className="cta-btn outline-btn"
                                      onClick={() => setEditingProduct(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="event-info">
                                      <strong>{product.name}</strong>
                                      <span>
                                        ${product.price} • {product.quantity}{" "}
                                        available
                                      </span>
                                    </div>
                                    <div className="admin-product-actions">
                                      <button
                                        className="cta-btn edit-btn"
                                        onClick={() =>
                                          setEditingProduct(product.id)
                                        }
                                      >
                                        Edit Qty
                                      </button>
                                      <button
                                        className="cta-btn delete-btn"
                                        onClick={() =>
                                          handleDeleteProduct(product.id)
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))
                        ) : (
                          <p className="no-events">
                            No merchandise yet. Add some above!
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Books Tab */}
                {adminActiveTab === "books" && (
                  <>
                    <div className="admin-section">
                      <h3>Add New Book</h3>
                      <form className="buy-meat-form" onSubmit={handleAddBook}>
                        <input
                          type="text"
                          placeholder="Book Title"
                          value={newBook.title}
                          onChange={(e) =>
                            setNewBook({ ...newBook, title: e.target.value })
                          }
                          required
                        />
                        <input
                          type="text"
                          placeholder="Author"
                          value={newBook.author}
                          onChange={(e) =>
                            setNewBook({ ...newBook, author: e.target.value })
                          }
                          required
                        />
                        <input
                          type="url"
                          placeholder="External Link (Amazon, Publisher, etc.)"
                          value={newBook.externalUrl}
                          onChange={(e) =>
                            setNewBook({
                              ...newBook,
                              externalUrl: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="text"
                          placeholder="Cover Image URL"
                          value={newBook.imageUrl}
                          onChange={(e) =>
                            setNewBook({ ...newBook, imageUrl: e.target.value })
                          }
                        />
                        <button type="submit" className="cta-btn primary-btn">
                          Add Book
                        </button>
                      </form>
                    </div>

                    <div className="admin-section">
                      <h3>Current Books</h3>
                      <div className="events-list admin-events-list">
                        {books.length > 0 ? (
                          books.map((book) => (
                            <div
                              key={book.id}
                              className="event-item admin-event-item"
                            >
                              {editingBook === book.id ? (
                                <div className="edit-product-form">
                                  <input
                                    type="text"
                                    placeholder="Title"
                                    defaultValue={book.title}
                                    id={`title-${book.id}`}
                                  />
                                  <input
                                    type="url"
                                    placeholder="External URL"
                                    defaultValue={book.externalUrl}
                                    id={`url-${book.id}`}
                                  />
                                  <button
                                    className="cta-btn primary-btn"
                                    onClick={() => {
                                      const title = document.getElementById(
                                        `title-${book.id}`,
                                      ).value;
                                      const externalUrl =
                                        document.getElementById(
                                          `url-${book.id}`,
                                        ).value;
                                      handleUpdateBook(book.id, {
                                        title,
                                        externalUrl,
                                      });
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="cta-btn outline-btn"
                                    onClick={() => setEditingBook(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="event-info">
                                    <strong>{book.title}</strong>
                                    <span>by {book.author}</span>
                                  </div>
                                  <div className="admin-product-actions">
                                    <button
                                      className="cta-btn edit-btn"
                                      onClick={() => setEditingBook(book.id)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="cta-btn delete-btn"
                                      onClick={() => handleDeleteBook(book.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="no-events">
                            No books yet. Add one above!
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Orders Tab */}
                {adminActiveTab === "orders" && (
                  <div className="admin-section">
                    <h3>Recent Orders</h3>
                    <div className="events-list admin-events-list orders-list">
                      {orders.length > 0 ? (
                        orders.map((order) => (
                          <div key={order.id} className="order-card">
                            <div className="order-card-header">
                              <strong>Order #{order.id}</strong>
                              <span className={`order-status ${order.status}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="order-card-body">
                              <p>
                                <strong>Date:</strong> {order.date} {order.time}
                              </p>
                              <p>
                                <strong>Customer:</strong> {order.firstName}{" "}
                                {order.lastName}
                              </p>
                              <p>
                                <strong>Email:</strong> {order.email}
                              </p>
                              <p>
                                <strong>Phone:</strong> {order.phone}
                              </p>
                              <p>
                                <strong>Address:</strong> {order.address},{" "}
                                {order.city}, {order.state} {order.zip}
                              </p>
                              <p>
                                <strong>Product:</strong> {order.productName}
                              </p>
                              <p>
                                <strong>Quantity:</strong> {order.quantity}
                              </p>
                              <p>
                                <strong>Total:</strong> $
                                {order.total.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-events">No orders yet.</p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  className="cta-btn outline-btn logout-btn"
                  onClick={() => setIsAdminAuthenticated(false)}
                >
                  Logout
                </button>
              </div>
            )}
            <button
              className="modal-close"
              onClick={() => closeModal(setIsAdminModalOpen)}
            >
              ×
            </button>
            <button
              className="cta-btn outline-btn modal-close-bottom"
              onClick={() => closeModal(setIsAdminModalOpen)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isRecipeModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => closeModal(setIsRecipeModalOpen)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Get Your Free Homecoming Ranch Recipe Book</h2>
            <p>
              Sign up to receive our exclusive recipe book featuring delicious
              dishes made with our regeneratively-raised meats!
            </p>
            {recipeFormStatus === "success" && (
              <div className="success-message">
                <p>Thank you for signing up!</p>
                <p
                  style={{
                    marginTop: "1rem",
                    fontSize: "1.1rem",
                    color: "#266148",
                  }}
                >
                  📧 Check your email inbox for a link to download your free
                  Recipe Book!
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    marginTop: "0.5rem",
                  }}
                >
                  (Don't forget to check your spam folder if you don't see it
                  within a few minutes)
                </p>
              </div>
            )}
            {recipeFormStatus === "error" && (
              <p className="error-message">
                Failed to submit form. Please try again.
              </p>
            )}
            {recipeFormStatus !== "success" && (
              <form className="buy-meat-form" onSubmit={handleRecipeSubmit}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  required
                />
                <input type="email" name="email" placeholder="Email" required />
                <label>
                  <input type="checkbox" name="newsletter" /> Subscribe to
                  Newsletter
                </label>
                <button type="submit" className="cta-btn primary-btn">
                  Get Recipe Book
                </button>
              </form>
            )}
            <button
              className="modal-close"
              onClick={() => closeModal(setIsRecipeModalOpen)}
            >
              ×
            </button>
            <button
              className="cta-btn outline-btn modal-close-bottom"
              onClick={() => closeModal(setIsRecipeModalOpen)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isEventSignupModalOpen && selectedEvent && (
        <div className="modal-overlay" onClick={closeEventSignupModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Sign Up for Event</h2>
            <div className="event-signup-details">
              <h3>{selectedEvent.name}</h3>
              <p>
                <strong>Date:</strong> {selectedEvent.date}
              </p>
              <p>
                <strong>Time:</strong> {selectedEvent.time}
              </p>
              <p>
                <strong>Type:</strong> {selectedEvent.type}
              </p>
            </div>
            {eventSignupFormStatus === "success" && (
              <div className="success-message">
                <p>You're signed up!</p>
                <p style={{ marginTop: "0.5rem", fontSize: "0.95rem" }}>
                  We've received your registration and will send you a
                  confirmation email with event details.
                </p>
              </div>
            )}
            {eventSignupFormStatus === "error" && (
              <p className="error-message">
                Failed to submit. Please try again.
              </p>
            )}
            {eventSignupFormStatus !== "success" && (
              <form
                className="buy-meat-form"
                onSubmit={handleEventSignupSubmit}
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                />
                <input type="email" name="email" placeholder="Email" required />
                <input type="tel" name="phone" placeholder="Phone (optional)" />
                <textarea
                  name="message"
                  placeholder="Any questions or comments? (optional)"
                  rows="3"
                ></textarea>
                <button type="submit" className="cta-btn primary-btn">
                  Submit Registration
                </button>
              </form>
            )}
            <button className="modal-close" onClick={closeEventSignupModal}>
              ×
            </button>
            <button
              className="cta-btn outline-btn modal-close-bottom"
              onClick={closeEventSignupModal}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Sticky Recipe Book Banner */}
      {showStickyBanner && !bannerDismissed && (
        <div className="sticky-banner">
          <div className="sticky-banner-inner">
            <span className="sticky-banner-label">
              📖 Free Ranch Recipe Book
            </span>
            {bannerFormStatus === "success" ? (
              <span className="sticky-banner-success">✓ Check your inbox!</span>
            ) : (
              <form
                className="sticky-banner-form"
                onSubmit={handleBannerRecipeSubmit}
              >
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  required
                />
                <input type="email" name="email" placeholder="Email" required />
                <input type="hidden" name="newsletter" value="Yes" />
                <button type="submit" className="sticky-banner-btn">
                  Get It Free →
                </button>
              </form>
            )}
          </div>
          <button
            className="sticky-banner-close"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
