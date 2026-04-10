import { useState } from "react";
import emailjs from "@emailjs/browser";

function ContactModal({ isOpen, onClose }) {
  const [formStatus, setFormStatus] = useState(null);

  if (!isOpen) return null;

  const getRecaptchaToken = async (action) => {
    try {
      if (window.grecaptcha) {
        return await window.grecaptcha.execute(
          "6LfhvD0sAAAAAJIwXSO7qe1l6LCaYgazEjGmOmS1",
          { action }
        );
      }
      return null;
    } catch (error) {
      console.warn("reCAPTCHA error:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const firstName = form.firstName.value;
    const lastName = form.lastName.value;
    const email = form.email.value;
    const phone = form.phone.value;
    const referralSource = form.referralSource.value;
    const subscribedToNewsletter = form.newsletter.checked;
    const comments = form.comments.value;
    form.newsletter.value = subscribedToNewsletter ? "Yes" : "No";

    try {
      const recaptchaToken = await getRecaptchaToken("contact_submit");

      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5001/homecoming-ranch-1c2d9/us-central1/contactSubmit"
        : "/api/contact-submit";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          referralSource,
          subscribedToNewsletter,
          comments,
          recaptchaToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit");
      }

      emailjs
        .sendForm("service_fftcjg1", "contact_us_template", form)
        .catch((err) => console.warn("EmailJS failed (non-critical):", err));

      setFormStatus("success");
      form.reset();
    } catch (error) {
      console.error("Contact Form Failed:", error);
      setFormStatus("error");
    }
  };

  const handleClose = () => {
    setFormStatus(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Contact Us</h2>
        {formStatus === "success" ? (
          <p className="success-message">
            Form submitted successfully! We'll get back to you soon.
          </p>
        ) : (
          <>
            {formStatus === "error" && (
              <p className="error-message">
                Failed to submit form. Please try again.
              </p>
            )}
            <form className="buy-meat-form" onSubmit={handleSubmit}>
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
              <select name="referralSource" required>
                <option value="">How Did You Hear About Us?</option>
                <option value="friends-family">Friends / Family</option>
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
                placeholder="Comments (optional)"
                rows="4"
              ></textarea>
              <button type="submit" className="cta-btn primary-btn">
                Send Message
              </button>
            </form>
          </>
        )}
        <button className="modal-close" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
}

export default ContactModal;
