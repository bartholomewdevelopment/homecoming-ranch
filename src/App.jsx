import React, { useState, useEffect } from 'react';
import './App.css';
import emailjs from '@emailjs/browser';
import logo from './assets/logo.png';
import heroImage from './assets/herd.png';
import rotationalGrazingImage from './assets/tractor.jpg';
import horsesImage from './assets/horses.jpg';
import highlandCattleImage from './assets/highland-cattle.jpg';
import gardeningImage from './assets/gardening.jpg';
import chickensImage from './assets/chickens.jpg';
import goatsImage from './assets/goats.jpg';
import cattleImage from './assets/cattle.jpg';
import cabinImage from './assets/cabin.png';
import cabinInteriorImage from './assets/cabin-interior.png';
import ranchViewImage from './assets/ranch-view.png';
import cabinExteriorImage from './assets/cabin-exterior.png';
import familyWorkingImage from './assets/milking-goat.jpg';
import goatsPastureImage from './assets/barn.jpg';
import cattleForagingImage from './assets/farmhouse.jpg';
import ohioHillsImage from './assets/goats.jpg';
import steaks from './assets/steaks.png';
import eggs from './assets/eggs.png';

function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isBuyMeatModalOpen, setIsBuyMeatModalOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isLearnMoreModalOpen, setIsLearnMoreModalOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isLivestockModalOpen, setIsLivestockModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isStayBookingModalOpen, setIsStayBookingModalOpen] = useState(false);
  const [selectedLivestock, setSelectedLivestock] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullImageView, setIsFullImageView] = useState(false);
  const [buyMeatFormStatus, setBuyMeatFormStatus] = useState(null);
  const [contactFormStatus, setContactFormStatus] = useState(null);

  useEffect(() => {
    emailjs.init("Ww_3InmrvIGGHR3m8"); // Replace with your EmailJS public key
  }, []);

  const galleryImages = [
    { src: cabinImage, alt: 'Cabin Exterior' },
    { src: cabinInteriorImage, alt: 'Cabin Interior' },
    { src: ranchViewImage, alt: 'Ranch View' },
    { src: cabinExteriorImage, alt: 'Another Cabin View' },
  ];

  const livestockInfo = {
    cows: {
      title: 'Highland Cows',
      content: (
        <>
          <p>
            The Scottish Highland breed produces meat that is considered premium beef because of the lean, marbled flesh that results in tender, flavorful cuts. A slow-maturing breed, calves are not butchered until they reach 24 to 30 months. While this results in a slow turn around, it contributes to the tenderness and succulent taste of the meat. Research in the US and UK also suggests that Highland beef is healthier than other types of beef, being lower in fat and cholesterol and higher in iron and protein.
          </p>
          <p>
            While Scottish Highland cattle are recognizable by their shaggy hair and bangs, there are several advantages to raising them that might not be so well known. The cows are notable for their good mothering and protective natures, and the breed is hardy and resilient and able to thrive on very low input from the breeder. Originating in the Scottish Highlands and coastal islands, they are able to adapt to rough terrain and different climates. They are also good foragers and often used to clean up and improve poor pastures, thriving and converting feed to beef in conditions considered unsuitable for other breeds.
          </p>
        </>
      ),
    },
    goats: {
      title: 'Goats',
      content: (
        <>
          <p>
            Goat meat is one of the most widely consumed meats worldwide and arguably the healthiest meat option available. While high in protein and iron, it has fewer calories than other meat, including beef, lamb, and pork, and less fat than any other meat, including chicken! In addition to the health benefits, goat meat, or chevon, is a tender, lean meat with a savory taste. It can be prepared multiple ways, including grilled, roasted, stewed, curried, barbecued, or made into sausage or bratwurst.
          </p>
          <p>
            Our goats are mostly hybrids of meat breeds such as Spanish, Kiko, Savanah, and Boer. Most meat breeds are specifically bred to produce heavily muscled goats, while Spanish varieties are particularly hardy, well-adapted survivors. At Homecoming Ranch, our goal is to breed a commercial goat that is perfectly adapted to forage and thrive on the local terrain so we can offer healthy meat to customers and excellent breeding stock to local farmers.
          </p>
        </>
      ),
    },
    lamb: {
      title: 'Lamb',
      content: (
        <>
          <p>
            Our pasture-raised lambs produce meat that's tender, flavorful, and packed with essential nutrients. Raised on diverse grasses and forbs, our lambs develop a rich flavor profile while maintaining a lean composition. Lamb is an excellent source of high-quality protein, vitamin B12, zinc, and iron.
          </p>
          <p>
            Our sheep thrive in our rotational grazing system, contributing to soil health while enjoying a natural diet free from grains and artificial supplements. This results in meat that's not only delicious but also aligns with our regenerative mission to restore the land and provide healthy food options.
          </p>
        </>
      ),
    },
    poultry: {
      title: 'Poultry (Seasonal)',
      content: (
        <>
          <p>
            Our free-range poultry is raised regeneratively with access to fresh pasture, sunlight, and a natural diet supplemented with non-GMO feed. This produces juicy, flavorful meat that's higher in Omega-3 fatty acids and vitamins compared to conventional poultry. Available seasonally, typically in spring and fall.
          </p>
          <p>
            Our chickens and turkeys roam freely in mobile coops that we rotate across the pastures, allowing them to scratch, peck, and fertilize the soil naturally. This practice enhances soil microbiology while ensuring our poultry live healthy, stress-free lives, resulting in superior meat quality.
          </p>
        </>
      ),
    },
  };

  const closeModal = (modalSetter) => {
    modalSetter(false);
    setIsFullImageView(false);
    setSelectedLivestock(null);
    setBuyMeatFormStatus(null); // Reset form status
    setContactFormStatus(null); // Reset form status
  };

  const openLivestockModal = (type) => {
    setSelectedLivestock(type);
    setIsLivestockModalOpen(true);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const openFullImage = () => {
    setIsFullImageView(true);
  };

  const closeFullImage = () => {
    setIsFullImageView(false);
  };

  const handleBuyMeatSubmit = (e) => {
    e.preventDefault();
    const form = e.target;

    // Convert checkbox value to "Yes" or "No"
    const newsletterValue = form.newsletter.checked ? "Yes" : "No";
    form.newsletter.value = newsletterValue;

    emailjs.sendForm("service_fftcjg1", "buy_meat_template", form)
      .then((response) => {
        console.log("Buy Meat Form Success!", response.status, response.text);
        setBuyMeatFormStatus("success");
        form.reset();
      })
      .catch((error) => {
        console.error("Buy Meat Form Failed...", error);
        setBuyMeatFormStatus("error");
      });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const form = e.target;

    // Convert checkbox value to "Yes" or "No"
    const newsletterValue = form.newsletter.checked ? "Yes" : "No";
    form.newsletter.value = newsletterValue;

    emailjs.sendForm("service_fftcjg1", "contact_us_template", form)
      .then((response) => {
        console.log("Contact Form Success!", response.status, response.text);
        setContactFormStatus("success");
        form.reset();
      })
      .catch((error) => {
        console.error("Contact Form Failed...", error);
        setContactFormStatus("error");
      });
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header sticky">
        <div className="header-left">
          <img src={logo} alt="Homecoming Ranch Logo" className="logo" />
        </div>
        <div className="header-right">
          <button className="nav-toggle" onClick={() => setIsNavOpen(!isNavOpen)}>
            ☰
          </button>
          <nav className={`nav ${isNavOpen ? 'open' : ''}`}>
            <a href="#home">Home</a>
            <a href="#buy-meat">Buy Meat</a>
            <a href="#book-stay" onClick={(e) => { e.preventDefault(); setIsStayBookingModalOpen(true); }}>Book a Stay</a>
            <a href="#ranch-life">Ranch Life</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); setIsContactModalOpen(true); }}>Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title animate-slide-in">Homecoming Ranch</h1>
          <h2 className="hero-subtitle animate-fade-in">
            🌱 Regenerative Ranching for a <br />Healthier Planet & Community 🌱
          </h2>
          <p className="animate-fade-in">
            Grass-fed beef & goat meat, sustainably farmed in Appalachian Ohio.
          </p>
          <div className="cta-buttons animate-slide-up">
            <button className="cta-btn primary-btn" onClick={() => setIsBuyMeatModalOpen(true)}>
              Buy Meat
            </button>
            <button
              className="cta-btn secondary-btn"
              onClick={() => setIsStayBookingModalOpen(true)}
            >
              Book a Stay
            </button>
            <button className="cta-btn outline-btn" onClick={() => setIsEventsModalOpen(true)}>
              See Events
            </button>
          </div>
        </div>
      </section>

      {/* What is Regenerative Ranching */}
      <section className="regenerative-info animate-section" style={{ '--logo-url': `url(${logo})` }}>
        <h2>What is Regenerative Ranching?</h2>
        <p className="highlight">
          🌍 Beyond sustainable—restoring the land while raising healthy animals.
        </p>
        <div className="feature-cards">
          <div className="feature-card">
            <p>Improves soil health by restoring nutrients naturally</p>
          </div>
          <div className="feature-card">
            <p>Increases biodiversity with natural grazing cycles</p>
          </div>
          <div className="feature-card">
            <p>Captures carbon and reduces emissions</p>
          </div>
          <div className="feature-card">
            <p>Healthier meat with more vitamins and better Omega-3 balance</p>
          </div>
        </div>
        <p className="highlight">
          📌 At Homecoming Ranch, we rebuild ecosystems.
        </p>
        <button className="cta-btn outline-btn" onClick={() => setIsLearnMoreModalOpen(true)}>
          Learn More
        </button>
      </section>

      {/* Livestock Section */}
      <section id="buy-meat" className="livestock animate-section" style={{ backgroundImage: `url(${cattleImage})` }}>
        <div className="livestock-overlay"></div>
        <div className="livestock-content">
          <h2>Our Regeneratively-Raised Livestock</h2>
          <div className="livestock-grid">
            <div className="livestock-item" onClick={() => openLivestockModal('cows')}>
              <h3>Highland Cows</h3>
              <p>100% Grass-Fed & Grass-Finished. Superior nutrition with higher Omega-3s.</p>
            </div>
            <div className="livestock-item" onClick={() => openLivestockModal('goats')}>
              <h3>Goats</h3>
              <p>Pasture-raised on natural forage. Lean, high-protein meat.</p>
            </div>
            <div className="livestock-item" onClick={() => openLivestockModal('lamb')}>
              <h3>Lamb</h3>
              <p>Pasture-raised, tender, and flavorful. Rich in essential nutrients.</p>
            </div>
            <div className="livestock-item" onClick={() => openLivestockModal('poultry')}>
              <h3>Poultry</h3>
              <p>Free-range, regeneratively raised. Juicy, high-quality meat.</p>
            </div>
          </div>
          <p className="highlight">🥩 Eating regeneratively supports your health & the planet!</p>
          <button className="cta-btn primary-btn" onClick={() => setIsBuyMeatModalOpen(true)}>
            Buy Meat
          </button>
        </div>
      </section>

      {/* Photo Grid */}
      <section className="photo-grid animate-section">
        <h2>Regenerative Ranching in Action</h2>
        <div className="grid">
          <div className="grid-item"><img src={rotationalGrazingImage} alt="Rotational Grazing" /></div>
          <div className="grid-item"><img src={horsesImage} alt="Soil Improvement" /></div>
          <div className="grid-item"><img src={highlandCattleImage} alt="Free-Range Animals" /></div>
          <div className="grid-item"><img src={gardeningImage} alt="Tree Planting" /></div>
          <div className="grid-item"><img src={chickensImage} alt="Free-Range Chickens" /></div>
          <div className="grid-item"><img src={goatsImage} alt="Pasture-Raised Goats" /></div>
        </div>
        <p>Every bite supports healthier ecosystems.</p>
      </section>

      {/* Stay Section */}
      <section id="book-stay" className="stay-section animate-section" style={{ backgroundImage: `url(${cabinImage})` }}>
        <div className="stay-overlay"></div>
        <div className="stay-content">
          <h2>Stay at Our Regenerative Ranch</h2>
          <p className="stay-description">
            Experience sustainable ranching: milk goats, collect eggs, and watch working dogs!
          </p>
          <div className="stay-buttons">
            <button
              className="cta-btn primary-btn"
              onClick={() => setIsStayBookingModalOpen(true)}
            >
              Book Your Stay
            </button>
            <button className="cta-btn outline-btn" onClick={() => setIsTourModalOpen(true)}>
              Tour the Cabin & Ranch
            </button>
          </div>
        </div>
      </section>

      {/* Ranch Life */}
      <section id="ranch-life" className="ranch-life animate-section">
        <h2>Ranch Life & The Homecoming Mission</h2>
        <div className="ranch-life-content">
          <div className="story-card">
            <h3>A Dream Takes Root</h3>
            <p>Homecoming Ranch began many years ago with a dream of building a farm that would bring everyone home—a place where Mom and Dad could work from home to craft a healthy, happy life for their family in the country by raising high-quality goats for meat and milk. This vision took root on a modest five-acre plot, but as the dream grew and refined, the family farm expanded to twenty acres and eventually settled into its current form: a sprawling 98-acre haven nestled in the lush, green hills of southern Ohio. Over time, the addition of Scottish Highland cattle broadened the ranch’s scope, expanding the vision to include providing premium beef to the local community and an ever-growing customer base.</p>
            <img src={familyWorkingImage} alt="Family working on the ranch" className="story-image" />
          </div>
          <div className="story-card">
            <h3>Regenerating the Land</h3>
            <p>Our goal has always been to develop a ranch management style that is both regenerative and sustainable. Instead of depleting nutrients in the soil, exhausting water supplies, and disrupting the local environment, we aim to cultivate practices that enhance the health and condition of the land. Highland cattle and most breeds of goats play a vital role in this mission, known for improving the quality of pastures through their natural foraging habits. By implementing intensive, rotational grazing, we increase soil fertility while reducing waste and dependence on external food sources like hay or grain. These practices not only contribute to the wellbeing of the land and the animals but also enrich the lives of the ranchers and customers who rely on the wholesome, nutrient-dense products we provide.</p>
            <div className="story-images">
              <img src={goatsPastureImage} alt="Goats in pasture" className="story-image-small" />
              <img src={cattleForagingImage} alt="Cattle foraging" className="story-image-small" />
            </div>
          </div>
          <div className="story-card">
            <h3>A Place for All</h3>
            <p>Beyond the land and livestock, Homecoming Ranch is a gathering place for loved ones—a sanctuary where family and friends can experience the joys of farm life and build strong relationships through meaningful work and play. It’s a foundation for learning and employment, designed to sustain current and future generations who wish to invest in and join the family business. Though built for and run by family, the ranch’s doors are wide open to friends and strangers alike, inviting all to become part of its mission and vision. With a labor of love (emphasis on labor), we strive to teach, learn, and grow alongside our neighbors—near and far—creating a community rooted in the regenerative spirit of the land and the warmth of home.</p>
            <img src={ohioHillsImage} alt="Lush hills of southern Ohio" className="story-image" />
          </div>
        </div>
        {/* Values Section */}
        <section className="values-section">
          <h2>Our Values</h2>
          <p>
            We believe that the values we hold dear are a critical part of what sets Homecoming Ranch apart. Our uncompromising commitment to these values is reflected in every aspect of our lives and should be evident in every encounter with others.
          </p>
          <div className="values-list">
            <div className="value-item">
              <h3>Honesty</h3>
              <p>
                Complete and accurate information. Honesty requires humility, courage and respect – <em>Principle of Truth</em>
              </p>
            </div>
            <div className="value-item">
              <h3>Relationships</h3>
              <p>
                People are of divine worth and origin. We strive to be generous and committed to mutual benefit – <em>Principle of Love</em>
              </p>
            </div>
            <div className="value-item">
              <h3>Work Ethic</h3>
              <p>
                Driven to get results through sustained, focused effort. – <em>Principle of Law of the Harvest</em>
              </p>
            </div>
            <div className="value-item">
              <h3>Choice</h3>
              <p>
                We understand the difference between influence and control. We strive to be an influence for good. – <em>Principle of Agency</em>
              </p>
            </div>
            <div className="value-item">
              <h3>Innovation</h3>
              <p>
                Always learning, growing, and adding value. Exercising faith and an abundance mentality. – <em>Principle of Creation</em>
              </p>
            </div>
          </div>
        </section>
        <div className="mission-vision">
          <div className="mission-card">
            <h4>🌱 Vision</h4>
            <p>The Homecoming Ranch will be a place for family and friends to gather. We will share a wholesome farm experience with children and their families. We will live life on our own terms as we raise healthy animals free of toxins. Our farm will be a working expression of our values. We will live faithfully and strive to magnify all of our callings.</p>
          </div>
          <div className="mission-card">
            <h4>🌿 Mission</h4>
            <p>Homecoming Ranch will provide our customers with toxin-free, healthy livestock products raised by high grass-fed and free-range or pasture-raised standards. We will earn the trust of our working partners and vendors by providing a good product, being consistent and fun to work with. We will provide a place for members of our community to share the joy of a family farm. We will create the opportunity to live the life of our choosing on a well-run, profitable farm that allows us to be self-reliant and contribute to the well-being of others.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <img src={logo} alt="Homecoming Ranch Logo" className="logo" />
        <p>© 2025 Homecoming Ranch.</p>
        <p>Website Built by <a href="https://bartholomewdevelopment.com" target="_blank" rel="noopener noreferrer">Bartholomew Development LLC</a> | <a href="mailto:inquiries@bartholomewdevelopment.com">inquiries@bartholomewdevelopment.com</a></p>
        <a href="https://instagram.com/homecoming_ranch" target="_blank" rel="noopener noreferrer">
          <span className="instagram-icon">📸 Follow Homecoming Ranch's journey!</span>
        </a>
      </footer>

      {/* Modals */}
      {isBuyMeatModalOpen && (
        <div className="modal-overlay" onClick={() => closeModal(setIsBuyMeatModalOpen)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={steaks} alt="Steaks" className="modal-image" />
            <h2>Inquire About Our Products</h2>
            {buyMeatFormStatus === "success" && (
              <p className="success-message">Form submitted successfully! We'll get back to you soon.</p>
            )}
            {buyMeatFormStatus === "error" && (
              <p className="error-message">Failed to submit form. Please try again.</p>
            )}
            <form className="buy-meat-form" onSubmit={handleBuyMeatSubmit}>
              <input type="text" name="firstName" placeholder="First Name" required />
              <input type="text" name="lastName" placeholder="Last Name" required />
              <input type="email" name="email" placeholder="Email" required />
              <input type="tel" name="phone" placeholder="Phone" required />
              <select name="product" required>
                <option value="">Which Product Are You Inquiring About?</option>
                <option value="highland-beef">Highland Beef</option>
                <option value="chevon">Chevon (Goat Meat)</option>
                <option value="lamb">Lamb</option>
                <option value="turkey">Turkey (Seasonal)</option>
              </select>
              <select name="referralSource" required>
                <option value="">How Did You Hear About Us?</option>
                <option value="cabin-guest">Cabin Guest</option>
                <option value="friends-family">Friends/Family</option>
                <option value="referral">Referral</option>
                <option value="instagram">Instagram</option>
                <option value="google-search">Google Search</option>
              </select>
              <label>
                <input type="checkbox" name="newsletter" /> Subscribe to Newsletter
              </label>
              <textarea name="comments" placeholder="Comments" rows="4"></textarea>
              <button type="submit" className="cta-btn primary-btn">Submit</button>
            </form>
            <button className="modal-close" onClick={() => closeModal(setIsBuyMeatModalOpen)}>×</button>
          </div>
        </div>
      )}

      {isEventsModalOpen && (
        <div className="modal-overlay" onClick={() => closeModal(setIsEventsModalOpen)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={eggs} alt="Steaks" className="modal-image" />
            <h2>Upcoming Events</h2>
            <ul className="events-list">
              <li>March 15, 2025 - Goat Milking Workshop (9 AM - 12 PM)</li>
              <li>April 10, 2025 - Rotational Grazing Tour (1 PM - 3 PM)</li>
              <li>May 22, 2025 - Sustainable Farming Seminar (10 AM - 2 PM)</li>
              <li>June 5, 2025 - Egg Collection Day (8 AM - 11 AM)</li>
            </ul>
            <button className="modal-close" onClick={() => closeModal(setIsEventsModalOpen)}>×</button>
          </div>
        </div>
      )}

      {isLearnMoreModalOpen && (
        <div className="modal-overlay" onClick={() => closeModal(setIsLearnMoreModalOpen)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Regenerative Ranching Explained</h2>
            <p>
              Regenerative ranching is a holistic approach to farming that goes beyond sustainability. It focuses on rebuilding soil health, enhancing biodiversity, and sequestering carbon while producing nutrient-dense food. At Homecoming Ranch, we use rotational grazing to mimic natural herd movements, allowing pastures to recover and thrive. This method improves water retention, reduces erosion, and supports a diverse ecosystem of plants, insects, and wildlife.
            </p>
            <p>
              Our practices result in healthier livestock—cows, goats, and more—that produce meat with higher levels of Omega-3 fatty acids, vitamins, and minerals. By choosing regenerative products, you’re not just eating better; you’re supporting a system that heals the planet. Learn more about our mission to restore 98 acres of Appalachian Ohio into a model of sustainable agriculture!
            </p>
            <div className="video-container">
              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/4R7mX6pChSA?si=Mgak409vqHvpEXPx"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
            <button className="modal-close" onClick={() => closeModal(setIsLearnMoreModalOpen)}>×</button>
            <button className="cta-btn outline-btn modal-close-bottom" onClick={() => closeModal(setIsLearnMoreModalOpen)}>
              Close
            </button>
          </div>
        </div>
      )}

      {isTourModalOpen && (
        <div className="modal-overlay" onClick={() => closeModal(setIsTourModalOpen)}>
          <div className="modal-content tour-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Tour the Cabin & Ranch</h2>
            {isFullImageView ? (
              <div className="full-image-view">
                <img
                  src={galleryImages[currentImageIndex].src}
                  alt={galleryImages[currentImageIndex].alt}
                  className="full-image"
                />
                <button className="cta-btn outline-btn back-button" onClick={closeFullImage}>
                  Back to Gallery
                </button>
              </div>
            ) : (
              <div className="gallery-carousel">
                <img
                  src={galleryImages[currentImageIndex].src}
                  alt={galleryImages[currentImageIndex].alt}
                  className="gallery-image"
                  onClick={openFullImage}
                />
                <p className="gallery-instruction">Click to view full-size image</p>
                <div className="gallery-controls">
                  <button className="gallery-arrow" onClick={prevImage}>
                    ←
                  </button>
                  <p>{`${currentImageIndex + 1} of ${galleryImages.length}`}</p>
                  <button className="gallery-arrow" onClick={nextImage}>
                    →
                  </button>
                </div>
              </div>
            )}
            <button className="modal-close" onClick={() => closeModal(setIsTourModalOpen)}>×</button>
            <button className="cta-btn outline-btn modal-close-bottom" onClick={() => closeModal(setIsTourModalOpen)}>
              Close
            </button>
          </div>
        </div>
      )}

      {isLivestockModalOpen && selectedLivestock && (
        <div className="modal-overlay" onClick={() => closeModal(setIsLivestockModalOpen)}>
          <div className="modal-content livestock-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{livestockInfo[selectedLivestock].title}</h2>
            {livestockInfo[selectedLivestock].content}
            <button className="modal-close" onClick={() => closeModal(setIsLivestockModalOpen)}>×</button>
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

      {isContactModalOpen && (
        <div className="modal-overlay" onClick={() => closeModal(setIsContactModalOpen)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Contact Us</h2>
            {contactFormStatus === "success" && (
              <p className="success-message">Form submitted successfully! We'll get back to you soon.</p>
            )}
            {contactFormStatus === "error" && (
              <p className="error-message">Failed to submit form. Please try again.</p>
            )}
            <form className="buy-meat-form" onSubmit={handleContactSubmit}>
              <input type="text" name="firstName" placeholder="First Name" required />
              <input type="text" name="lastName" placeholder="Last Name" required />
              <input type="email" name="email" placeholder="Email" required />
              <input type="tel" name="phone" placeholder="Phone" required />
              <select name="referralSource" required>
                <option value="">How Did You Hear About Us?</option>
                <option value="cabin-guest">Cabin Guest</option>
                <option value="friends-family">Friends/Family</option>
                <option value="referral">Referral</option>
                <option value="instagram">Instagram</option>
                <option value="google-search">Google Search</option>
              </select>
              <label>
                <input type="checkbox" name="newsletter" /> Subscribe to Newsletter
              </label>
              <textarea name="comments" placeholder="Comments" rows="4"></textarea>
              <button type="submit" className="cta-btn primary-btn">Submit</button>
            </form>
            <button className="modal-close" onClick={() => closeModal(setIsContactModalOpen)}>×</button>
            <button className="cta-btn outline-btn modal-close-bottom" onClick={() => closeModal(setIsContactModalOpen)}>
              Close
            </button>
          </div>
        </div>
      )}

      {isStayBookingModalOpen && (
        <div className="modal-overlay" onClick={() => closeModal(setIsStayBookingModalOpen)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Book Your Stay</h2>
            <p>Select a platform to book your stay at Homecoming Ranch:</p>
            <div className="booking-links">
              <a
                href="https://www.airbnb.com/h/homecomingranchcabin"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn booking-link"
              >
                Book on Airbnb
              </a>
              <a
                href="https://t.vrbo.io/UuLw6otUmRb"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn booking-link"
              >
                Book on VRBO
              </a>
              <a
                href="https://farmstayus.com/farm/homecoming-ranch/"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn booking-link"
              >
                Book on FarmStayUS
              </a>
            </div>
            <button className="modal-close" onClick={() => closeModal(setIsStayBookingModalOpen)}>×</button>
            <button
              className="cta-btn outline-btn modal-close-bottom"
              onClick={() => closeModal(setIsStayBookingModalOpen)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;