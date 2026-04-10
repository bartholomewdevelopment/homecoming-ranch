import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import "./App.css";
import "./Experiences.css";
import logo from "./assets/logo.png";
import cattleImg from "./assets/highland-cattle.jpg";
import horsesImg from "./assets/horses.jpg";
import barnImg from "./assets/barn.jpg";
import cattleImg2 from "./assets/cattle.jpg";
import ContactModal from "./ContactModal";

const EXPERIENCES = [
  {
    id: "farm-tour",
    title: "Farm Tour",
    subtitle: "Guided · 60–75 min",
    badge: null,
    heroImg: cattleImg,
    heroAlt: "Highland cattle on pasture — ranch tour placeholder",
    description:
      "Walk the pastures with a knowledgeable guide, meet our Highland and Dexter cattle up close, and hear the story of how Homecoming Ranch is rebuilding an Appalachian ecosystem one herd at a time.",
    includes: ["Guided pasture walk", "Cattle meet-and-greet", "Ranch history & story"],
    pricing: [
      { label: "Adult", price: "$18 / person" },
      { label: "Child", price: "$12 / person" },
      { label: "Group (10+)", price: "$14 / person" },
    ],
    formFields: { adults: true, children: true, groupSize: true },
  },
  {
    id: "herd-dog-demo",
    title: "Herd Dog Demonstration",
    subtitle: "30 min · Saturdays (2× daily)",
    badge: "Add-on or Standalone",
    heroImg: horsesImg,
    heroAlt: "Ranch working dog demonstration — placeholder image",
    description:
      "Watch our skilled herd dogs work livestock in real time. This fast-paced, impressive demonstration shows the intelligence and training behind our ranch's daily operations.",
    includes: ["Live herding demonstration", "Q&A with handler", "Photo opportunity"],
    pricing: [
      { label: "Per person", price: "$12 / person" },
      { label: "Group (10+)", price: "$9 / person" },
    ],
    formFields: { adults: false, children: false, groupSize: true },
  },
  {
    id: "tour-demo-combo",
    title: "Tour + Demo Combo",
    subtitle: "75–90 min · Best Value",
    badge: "⭐ Recommended",
    heroImg: cattleImg2,
    heroAlt: "Ranch cattle herd — tour and demo combo placeholder",
    description:
      "Get the full Homecoming Ranch experience. Combine the guided farm tour with the herd dog demonstration for a complete look at regenerative ranch life from pasture to working dogs.",
    includes: ["Full guided farm tour", "Herd dog demonstration", "Cattle meet-and-greet", "Ranch history"],
    pricing: [
      { label: "Adult", price: "$26 / person" },
      { label: "Child", price: "$18 / person" },
      { label: "Group (10+)", price: "$20 / person" },
    ],
    formFields: { adults: true, children: true, groupSize: true },
  },
  {
    id: "school-group",
    title: "School & Educational Group",
    subtitle: "Custom Duration · Schools & Youth Groups",
    badge: "Educational",
    heroImg: barnImg,
    heroAlt: "Ranch barn and farmstead — educational group placeholder",
    description:
      "Bring regenerative agriculture to life for your students. Our educational group experience is tailored to your curriculum needs, covering soil science, animal husbandry, and sustainable food systems.",
    includes: ["Curriculum-aligned content", "Hands-on pasture activities", "Animal interaction", "Q&A with ranch educators"],
    pricing: [
      { label: "Per student", price: "$10 / student" },
      { label: "Group (15+ students)", price: "$8 / student" },
    ],
    formFields: { adults: false, children: false, groupSize: true, school: true },
  },
];

export default function Experiences() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [signupModal, setSignupModal] = useState(null); // experience object
  const [formStatus, setFormStatus] = useState(null);

  useEffect(() => {
    emailjs.init("-FGqvzXuTYnZckP4F");
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/getEvents"
        : "/api/events";
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.success && data.events) setEvents(data.events);
    } catch (e) {
      console.error("Failed to fetch events:", e);
    }
  };

  const openSignup = (exp) => {
    setSignupModal(exp);
    setFormStatus(null);
  };

  const closeSignup = () => {
    setSignupModal(null);
    setFormStatus(null);
  };

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

  const formatSignupMessage = (p) => {
    const lines = [
      `Experience: ${p.experience}`,
      `Email: ${p.email}`,
      p.phone && `Phone: ${p.phone}`,
      p.adults && `Adults: ${p.adults}`,
      p.children && `Children: ${p.children}`,
      p.groupSize && `Group size: ${p.groupSize}`,
      p.institution && `Institution: ${p.institution}`,
      p.gradeLevel && `Grade level: ${p.gradeLevel}`,
      p.comments && `Comments: ${p.comments}`,
    ].filter(Boolean);
    return lines.join("\n");
  };

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
          <h1>Ranch Experiences</h1>
          <p>Step onto the land. Meet the animals. See regenerative ranching in action.</p>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="exp-section exp-events-section">
        <div className="exp-section-inner">
          <h2>Upcoming Events &amp; Ranch Tours</h2>
          <p className="exp-section-sub">Join us for scheduled tours, workshops, and hands-on farm activities.</p>
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
                  <button className="cta-btn primary-btn exp-event-btn" onClick={() => openSignup(EXPERIENCES.find(x => x.id === "farm-tour"))}>
                    Sign Up
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="exp-no-events">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#BBF7D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              <p>2026 events coming soon — check back shortly or <button className="exp-inline-link" onClick={() => openSignup(EXPERIENCES[0])}>request a private tour</button>.</p>
            </div>
          )}
        </div>
      </section>

      {/* Experiences */}
      <section className="exp-section exp-cards-section">
        <div className="exp-section-inner">
          <h2>Choose Your Experience</h2>
          <p className="exp-section-sub">Every visit is guided, hands-on, and deeply rooted in the land.</p>
          <div className="exp-cards">
            {EXPERIENCES.map((exp) => (
              <article key={exp.id} className={`exp-card${exp.badge === "⭐ Recommended" ? " exp-card--featured" : ""}`}>
                <div className="exp-card-img-wrap">
                  <img src={exp.heroImg} alt={exp.heroAlt} className="exp-card-img" />
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
                    {exp.includes.map((item) => (
                      <li key={item}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="exp-card-pricing">
                    {exp.pricing.map((p) => (
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

      {/* Footer */}
      <footer className="footer">
        <img src={logo} alt="Homecoming Ranch Logo" className="logo" />
        <p>© 2025 Homecoming Ranch.</p>
        <p>
          Website Built by{" "}
          <a href="https://bartholomewdevelopment.com" target="_blank" rel="noopener noreferrer">Bartholomew Development LLC</a>{" "}|{" "}
          <a href="mailto:inquiries@bartholomewdevelopment.com">inquiries@bartholomewdevelopment.com</a>
        </p>
        <a href="https://instagram.com/homecoming_ranch" target="_blank" rel="noopener noreferrer">
          <span className="instagram-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{display:"inline",verticalAlign:"middle",marginRight:"0.4em"}}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            Follow Homecoming Ranch's journey
          </span>
        </a>
      </footer>

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

                {signupModal.formFields.adults && (
                  <div className="exp-form-row">
                    <input type="number" name="adults" placeholder="# of Adults" min="0" />
                    <input type="number" name="children" placeholder="# of Children" min="0" />
                  </div>
                )}

                {signupModal.formFields.groupSize && !signupModal.formFields.adults && (
                  <input type="number" name="groupSize" placeholder="Total Group Size" min="1" />
                )}

                {signupModal.formFields.groupSize && signupModal.formFields.adults && (
                  <input type="number" name="groupSize" placeholder="Total Group Size (leave blank if not a group)" min="1" />
                )}

                {signupModal.formFields.school && (
                  <>
                    <input type="text" name="institution" placeholder="School / Institution Name" required />
                    <input type="text" name="gradeLevel" placeholder="Grade Level(s)" />
                  </>
                )}

                <textarea name="comments" placeholder="Questions or special requests" rows="3" />

                <div className="exp-pricing-reminder">
                  {signupModal.pricing.map((p) => (
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
