import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import ContactModal from "./ContactModal";
import logo from "./assets/logo.png";
import familyWorkingImage from "./assets/milking-goat.jpg";
import goatsPastureImage from "./assets/barn.jpg";
import cattleForagingImage from "./assets/farmhouse.jpg";
import ohioHillsImage from "./assets/goats.jpg";
import rotationalGrazingImage from "./assets/tractor.jpg";
import horsesImage from "./assets/horses.jpg";
import highlandCattleImage from "./assets/highland-cattle.jpg";
import gardeningImage from "./assets/gardening.jpg";
import chickensImage from "./assets/chickens.jpg";
import goatsImage from "./assets/goats.jpg";

function AboutUs() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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
            <a href="#contact" onClick={(e) => { e.preventDefault(); setIsContactModalOpen(true); }}>Contact</a>
          </nav>
        </div>
      </header>

      {/* Ranch Life */}
      <section id="ranch-life" className="ranch-life animate-section">
        <h2>Ranch Life & The Homecoming Mission</h2>
        <div className="ranch-life-content">
          <div className="story-card">
            <h3>A Dream Takes Root</h3>
            <p>
              Homecoming Ranch began many years ago with a dream of building a
              farm that would bring everyone home—a place where Mom and Dad
              could work from home to craft a healthy, happy life for their
              family in the country by raising high-quality goats for meat and
              milk. This vision took root on a modest five-acre plot, but as the
              dream grew and refined, the family farm expanded to twenty acres
              and eventually settled into its current form: a sprawling 98-acre
              haven nestled in the lush, green hills of southern Ohio. Over
              time, the addition of Scottish Highland cattle broadened the
              ranch's scope, expanding the vision to include providing premium
              beef to the local community and an ever-growing customer base.
            </p>
            <img
              src={familyWorkingImage}
              alt="Family working on the ranch"
              className="story-image"
            />
          </div>
          <div className="story-card">
            <h3>A Place for All</h3>
            <p>
              Beyond the land and livestock, Homecoming Ranch is a gathering
              place for loved ones—a sanctuary where family and friends can
              experience the joys of farm life and build strong relationships
              through meaningful work and play. It's a foundation for learning
              and employment, designed to sustain current and future generations
              who wish to invest in and join the family business. Though built
              for and run by family, the ranch's doors are wide open to friends
              and strangers alike, inviting all to become part of its mission
              and vision. With a labor of love (emphasis on labor), we strive to
              teach, learn, and grow alongside our neighbors—near and
              far—creating a community rooted in the regenerative spirit of the
              land and the warmth of home.
            </p>
          </div>

          <div className="story-card">
            <h3>Regenerating the Land</h3>
            <p>
              Our goal has always been to develop a ranch management style that
              is both regenerative and sustainable. Instead of depleting
              nutrients in the soil, exhausting water supplies, and disrupting
              the local environment, we aim to cultivate practices that enhance
              the health and condition of the land. Highland cattle and most
              breeds of goats play a vital role in this mission, known for
              improving the quality of pastures through their natural foraging
              habits. By implementing intensive, rotational grazing, we increase
              soil fertility while reducing waste and dependence on external
              food sources like hay or grain. These practices not only
              contribute to the wellbeing of the land and the animals but also
              enrich the lives of the ranchers and customers who rely on the
              wholesome, nutrient-dense products we provide.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Grid */}
      <section className="photo-grid animate-section">
        <div className="grid">
          <div className="grid-item">
            <img src={highlandCattleImage} alt="Pasture Raised Animals" />
          </div>
          <div className="grid-item">
            <img src={chickensImage} alt="Pasture Raised Chickens" />
          </div>
          <div className="grid-item">
            <img src={goatsImage} alt="Pasture-Raised Goats" />
          </div>
        </div>
        <p>Every bite supports healthier ecosystems.</p>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <h2>Our Values</h2>
        <p>
          We believe that the values we hold dear are a critical part of what
          sets Homecoming Ranch apart. Our uncompromising commitment to these
          values is reflected in every aspect of our lives and should be evident
          in every encounter with others.
        </p>
        <div className="values-list">
          <div className="value-item">
            <h3>Honesty</h3>
            <p>
              Complete and accurate information. Honesty requires humility,
              courage and respect – <em>Principle of Truth</em>
            </p>
          </div>
          <div className="value-item">
            <h3>Relationships</h3>
            <p>
              People are of divine worth and origin. We strive to be generous
              and committed to mutual benefit – <em>Principle of Love</em>
            </p>
          </div>
          <div className="value-item">
            <h3>Work Ethic</h3>
            <p>
              Driven to get results through sustained, focused effort. –{" "}
              <em>Principle of Law of the Harvest</em>
            </p>
          </div>
          <div className="value-item">
            <h3>Choice</h3>
            <p>
              We understand the difference between influence and control. We
              strive to be an influence for good. – <em>Principle of Agency</em>
            </p>
          </div>
          <div className="value-item">
            <h3>Innovation</h3>
            <p>
              Always learning, growing, and adding value. Exercising faith and
              an abundance mentality. – <em>Principle of Creation</em>
            </p>
          </div>
        </div>
      </section>

      {/* Mission and Vision */}
      <div className="mission-vision">
        <div className="mission-card">
          <h4>🌱 Vision</h4>
          <p>
            The Homecoming Ranch will be a place for family and friends to
            gather. We will share a wholesome farm experience with children and
            their families. We will live life on our own terms as we raise
            healthy animals free of toxins. Our farm will be a working
            expression of our values. We will live faithfully and strive to
            magnify all of our callings.
          </p>
        </div>
        <div className="mission-card">
          <h4>🌿 Mission</h4>
          <p>
            Homecoming Ranch will provide our customers with toxin-free, healthy
            livestock products raised by high grass-fed and pasture-raised
            standards. We will earn the trust of our working partners and
            vendors by providing a good product, being consistent and fun to
            work with. We will provide a place for members of our community to
            share the joy of a family farm. We will create the opportunity to
            live the life of our choosing on a well-run, profitable farm that
            allows us to be self-reliant and contribute to the well-being of
            others.
          </p>
        </div>
      </div>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

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
    </div>
  );
}

export default AboutUs;
