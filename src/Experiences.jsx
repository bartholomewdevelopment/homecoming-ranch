import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import emailjs from "@emailjs/browser";
import "./App.css";
import "./Experiences.css";
import logo from "./assets/logo.png";
import cattleImg2 from "./assets/cattle.jpg";
import ContactModal from "./ContactModal";

export default function Experiences() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [signupModal, setSignupModal] = useState(null);
  const [formStatus, setFormStatus] = useState(null);

  useEffect(() => {
    emailjs.init("-FGqvzXuTYnZckP4F");
    fetchEvents();
    fetchExperiences();
  }, []);

  const fetchEvents = async () => {
    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/getEvents"
        : "/api/events";
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.success && data.events) setEvents(data.events);
    } catch (e) {
      console.error("Failed to fetch events:", e);
    }
  };

  const fetchExperiences = async () => {
    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/getExperiences"
        : "/api/experiences";
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.success && data.experiences) setExperiences(data.experiences);
    } catch (e) {
      console.error("Failed to fetch experiences:", e);
    }
  };

  const openSignup = (exp) => { setSignupModal(exp); setFormStatus(null); };
  const closeSignup = () => { setSignupModal(null); setFormStatus(null); };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      experience: signupModal.title,
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      email: form.email.value,
      phone: form.phone.value,
      preferredDate: form.preferredDate.value,
      adults: form.adults?.value || "",
      children: form.children?.value || "",
      groupSize: form.groupSize?.value || "",
      institution: form.institution?.value || "",
      gradeLevel: form.gradeLevel?.value || "",
      comments: form.comments.value,
    };
    try {
      await emailjs.send("service_fftcjg1", "template_n2joi5n", {
        name: `${payload.firstName} ${payload.lastName}`,
        message: formatSignupMessage(payload),
        event: payload.experience,
        eventdate: payload.preferredDate,
        eventtime: "",
        time: new Date().toLocaleString(),
      });
      setFormStatus("success");
      form.reset();
    } catch (err) {
      console.error("Signup failed:", err);
      setFormStatus("error");
    }
  };

  const formatSignupMessage = (p) =>
    [
      `Experience: ${p.experience}`,
      `Email: ${p.email}`,
      p.phone && `Phone: ${p.phone}`,
      p.adults && `Adults: ${p.adults}`,
      p.children && `Children: ${p.children}`,
      p.groupSize && `Group size: ${p.groupSize}`,
      p.institution && `Institution: ${p.institution}`,
      p.gradeLevel && `Grade level: ${p.gradeLevel}`,
      p.comments && `Comments: ${p.comments}`,
    ]
      .filter(Boolean)
      .join("\n");

  return (
    <div className="app">
      {/* Header */}
      <header className="header sticky">
        <div className="header-left">
          <img src={logo} alt="Homecoming Ranch Logo" className="logo" />
        </div>
        <div className="header-right">
          <button className="nav-toggle" onClick={() => setIsNavOpen(!isNavOpen)}>☰</button>
          <nav className={`nav ${isNavOpen ? "open" : ""}`}>
            <Link to="/">Home</Link>
            <Link to="/store">Store</Link>
            <Link to="/experiences">Experiences</Link>
            <Link to="/about">About Us</Link>
            <a href="#contact" onClick={(e) => { e.preventDefault(); setIsContactModalOpen(true); }}>Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="exp-hero" style={{ backgroundImage: `url(${cattleImg2})` }}>
        <div className="exp-hero-overlay" />
        <div className="exp-hero-content">
          <h1>Ranch Experiences in Hocking Hills, Ohio</h1>
          <p>Step onto the land. Meet the animals. See regenerative ranching in action — right here in Hocking Hills.</p>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="exp-section exp-events-section">
        <div className="exp-section-inner">
          <h2>Upcoming Events &amp; Ranch Tours</h2>
          <p className="exp-section-sub">Join us for scheduled tours, workshops, and hands-on farm activities at our Hocking Hills regenerative ranch.</p>
          <div className="exp-events-layout">
            <div className="exp-events-left">
              {events.length > 0 ? (
                <div className="exp-events-grid">
                  {events.map((ev) => (
                    <div key={ev.id} className="exp-event-card">
                      <div className="exp-event-badge">{ev.type}</div>
                      <h3>{ev.name}</h3>
                      <div className="exp-event-meta">
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                          {ev.date}
                        </span>
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {ev.time}
                        </span>
                      </div>
                      <button
                        className="cta-btn primary-btn exp-event-btn"
                        onClick={() => experiences.length > 0 && openSignup(experiences[0])}
                      >
                        Sign Up
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="exp-no-events">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#BBF7D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  <p>2026 events coming soon — check back shortly or{" "}
                    <button className="exp-inline-link" onClick={() => experiences.length > 0 && openSignup(experiences[0])}>
                      request a private tour
                    </button>.
                  </p>
                </div>
              )}
            </div>

            <div className="exp-directions">
              <h3 className="exp-directions-heading">Getting Here</h3>
              <p className="exp-directions-address">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                39240 State Route 56<br />Nelsonville, OH 45686
              </p>
              <a
                href="https://maps.google.com/?q=39240+State+Route+56,+Nelsonville,+OH+45686"
                target="_blank"
                rel="noopener noreferrer"
                className="exp-map-static"
                aria-label="Open Homecoming Ranch location in Google Maps"
              >
                <div className="exp-map-static-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#266148" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span className="exp-map-label">39240 State Route 56<br />Nelsonville, OH 45686</span>
                  <span className="exp-map-cta">Tap to open in Google Maps →</span>
                </div>
              </a>
              <div className="exp-road-alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                <div>
                  <strong>Road Closure Notice</strong>
                  <p>State Route 56 between our ranch and Athens is closed for approximately 6 months. If traveling from Athens, please plan an alternate route. Contact us if you need directions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experiences */}
      <section className="exp-section exp-cards-section">
        <div className="exp-section-inner">
          <h2>Choose Your Experience</h2>
          <p className="exp-section-sub">Every visit is guided, hands-on, and deeply rooted in the land.</p>
          <div className="exp-cards">
            {experiences.map((exp) => (
              <article
                key={exp.id}
                className={`exp-card${exp.badge === "⭐ Recommended" ? " exp-card--featured" : ""}`}
              >
                <div className="exp-card-img-wrap">
                  {exp.imageUrl && (
                    <img src={exp.imageUrl} alt={exp.imageAlt || exp.title} className="exp-card-img" />
                  )}
                  {exp.badge && (
                    <span className={`exp-card-badge${exp.badge === "⭐ Recommended" ? " exp-card-badge--featured" : ""}`}>
                      {exp.badge}
                    </span>
                  )}
                </div>
                <div className="exp-card-body">
                  <div className="exp-card-header">
                    <h3>{exp.title}</h3>
                    <span className="exp-card-subtitle">{exp.subtitle}</span>
                  </div>
                  <p className="exp-card-desc">{exp.description}</p>
                  <ul className="exp-card-includes">
                    {(exp.includes || []).map((item) => (
                      <li key={item}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="exp-card-pricing">
                    {(exp.pricing || []).map((p) => (
                      <div key={p.label} className="exp-price-row">
                        <span className="exp-price-label">{p.label}</span>
                        <span className="exp-price-value">{p.price}</span>
                      </div>
                    ))}
                  </div>
                  <button className="cta-btn primary-btn exp-signup-btn" onClick={() => openSignup(exp)}>
                    Book This Experience
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Sign-up Modal */}
      {signupModal && (
        <div className="modal-overlay" onClick={closeSignup}>
          <div className="modal-content exp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeSignup}>×</button>
            <h2>Book: {signupModal.title}</h2>
            <p className="modal-subtitle">{signupModal.subtitle}</p>

            {formStatus === "success" ? (
              <div className="exp-form-success">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <h3>You're on the list!</h3>
                <p>We'll be in touch shortly to confirm your booking. We look forward to seeing you at Homecoming Ranch.</p>
                <button className="cta-btn primary-btn" onClick={closeSignup}>Close</button>
              </div>
            ) : (
              <form className="buy-meat-form exp-signup-form" onSubmit={handleSignupSubmit}>
                {formStatus === "error" && (
                  <p className="error-message">Something went wrong — please try again or email us directly.</p>
                )}
                <div className="exp-form-row">
                  <input type="text" name="firstName" placeholder="First Name" required />
                  <input type="text" name="lastName" placeholder="Last Name" required />
                </div>
                <input type="email" name="email" placeholder="Email Address" required />
                <input type="tel" name="phone" placeholder="Phone Number" required />
                <input type="date" name="preferredDate" required title="Preferred Visit Date" />

                {signupModal.formFields?.adults && (
                  <div className="exp-form-row">
                    <input type="number" name="adults" placeholder="# of Adults" min="0" />
                    <input type="number" name="children" placeholder="# of Children" min="0" />
                  </div>
                )}
                {signupModal.formFields?.groupSize && !signupModal.formFields?.adults && (
                  <input type="number" name="groupSize" placeholder="Total Group Size" min="1" />
                )}
                {signupModal.formFields?.groupSize && signupModal.formFields?.adults && (
                  <input type="number" name="groupSize" placeholder="Total Group Size (leave blank if not a group)" min="1" />
                )}
                {signupModal.formFields?.school && (
                  <>
                    <input type="text" name="institution" placeholder="School / Institution Name" required />
                    <input type="text" name="gradeLevel" placeholder="Grade Level(s)" />
                  </>
                )}
                <textarea name="comments" placeholder="Questions or special requests" rows="3" />
                <div className="exp-pricing-reminder">
                  {(signupModal.pricing || []).map((p) => (
                    <span key={p.label}>{p.label}: <strong>{p.price}</strong></span>
                  ))}
                </div>
                <button type="submit" className="cta-btn primary-btn">Request Booking</button>
              </form>
            )}
          </div>
        </div>
      )}

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
}
