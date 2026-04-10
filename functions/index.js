import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {
  checkRateLimit,
  sanitizeString,
  isValidEmail,
  isValidPhone,
  applyCORS,
  getClientIP,
  validateAdminPassword,
  verifyRecaptcha,
} from "./security.js";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const storage = getStorage();

// Define secrets
const adminPassword = defineSecret("ADMIN_PASSWORD");
const recaptchaSecretKey = defineSecret("RECAPTCHA_SECRET_KEY");

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://homecomingranch.com",
  "https://www.homecomingranch.com",
  "https://homecoming-ranch-1c2d9.web.app",
  "https://homecoming-ranch-1c2d9.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:5000",
];

/**
 * Format date and time in America/New_York timezone
 */
function getFormattedDateTime() {
  const now = new Date();
  const dateOptions = {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const timeOptions = {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  const date = new Intl.DateTimeFormat("en-US", dateOptions).format(now);
  const time = new Intl.DateTimeFormat("en-US", timeOptions).format(now);
  return { date, time };
}

/**
 * Shared CORS + method guard. Returns false and sends response if blocked.
 */
function handleCorsAndMethod(req, res, method) {
  if (req.method === "OPTIONS") {
    if (applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(204).send("");
    } else {
      res.status(403).send("Origin not allowed");
    }
    return false;
  }
  if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
    res.status(403).json({ success: false, error: "Origin not allowed" });
    return false;
  }
  if (req.method !== method) {
    res
      .status(405)
      .json({ success: false, error: `Method not allowed. Use ${method}.` });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// recipeSignup
// ---------------------------------------------------------------------------
export const recipeSignup = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [recaptchaSecretKey],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { firstName, email, subscribedToNewsletter, recaptchaToken } =
        req.body;

      const recaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        recaptchaSecretKey.value(),
        "recipe_signup",
        0.5,
      );
      if (!recaptchaResult.success) {
        res
          .status(400)
          .json({
            success: false,
            error: "Bot detection failed. Please try again.",
          });
        return;
      }

      if (
        !firstName ||
        typeof firstName !== "string" ||
        firstName.trim() === ""
      ) {
        res
          .status(400)
          .json({ success: false, error: "First name is required" });
        return;
      }
      if (!email || !isValidEmail(email.trim())) {
        res
          .status(400)
          .json({ success: false, error: "Valid email is required" });
        return;
      }

      const { date, time } = getFormattedDateTime();
      await db.collection("leads").add({
        firstName: sanitizeString(firstName, 100),
        email: email.trim().toLowerCase(),
        subscribedToNewsletter: !!subscribedToNewsletter,
        date,
        time,
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({ success: true, message: "Successfully signed up!" });
    } catch (error) {
      console.error("Error in recipeSignup:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to submit. Please try again." });
    }
  },
);

// ---------------------------------------------------------------------------
// contactSubmit
// ---------------------------------------------------------------------------
export const contactSubmit = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [recaptchaSecretKey],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        referralSource,
        subscribedToNewsletter,
        comments,
        recaptchaToken,
      } = req.body;

      const recaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        recaptchaSecretKey.value(),
        "contact_submit",
        0.5,
      );
      if (!recaptchaResult.success) {
        res
          .status(400)
          .json({
            success: false,
            error: "Bot detection failed. Please try again.",
          });
        return;
      }

      if (
        !firstName ||
        typeof firstName !== "string" ||
        firstName.trim() === ""
      ) {
        res
          .status(400)
          .json({ success: false, error: "First name is required" });
        return;
      }
      if (!lastName || typeof lastName !== "string" || lastName.trim() === "") {
        res
          .status(400)
          .json({ success: false, error: "Last name is required" });
        return;
      }
      if (!email || !isValidEmail(email.trim())) {
        res
          .status(400)
          .json({ success: false, error: "Valid email is required" });
        return;
      }
      if (!phone || !isValidPhone(phone.trim())) {
        res
          .status(400)
          .json({ success: false, error: "Valid phone number is required" });
        return;
      }

      const { date, time } = getFormattedDateTime();
      await db.collection("contacts").add({
        firstName: sanitizeString(firstName, 100),
        lastName: sanitizeString(lastName, 100),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        referralSource: referralSource
          ? sanitizeString(referralSource, 200)
          : "",
        subscribedToNewsletter: !!subscribedToNewsletter,
        comments: comments ? sanitizeString(comments, 1000) : "",
        date,
        time,
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
      console.error("Error in contactSubmit:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to submit. Please try again." });
    }
  },
);

// ---------------------------------------------------------------------------
// buyMeatSubmit
// ---------------------------------------------------------------------------
export const buyMeatSubmit = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [recaptchaSecretKey],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        product,
        referralSource,
        subscribedToNewsletter,
        comments,
        recaptchaToken,
      } = req.body;

      const recaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        recaptchaSecretKey.value(),
        "buy_meat_submit",
        0.5,
      );
      if (!recaptchaResult.success) {
        res
          .status(400)
          .json({
            success: false,
            error: "Bot detection failed. Please try again.",
          });
        return;
      }

      if (
        !firstName ||
        typeof firstName !== "string" ||
        firstName.trim() === ""
      ) {
        res
          .status(400)
          .json({ success: false, error: "First name is required" });
        return;
      }
      if (!lastName || typeof lastName !== "string" || lastName.trim() === "") {
        res
          .status(400)
          .json({ success: false, error: "Last name is required" });
        return;
      }
      if (!email || !isValidEmail(email.trim())) {
        res
          .status(400)
          .json({ success: false, error: "Valid email is required" });
        return;
      }
      if (!phone || !isValidPhone(phone.trim())) {
        res
          .status(400)
          .json({ success: false, error: "Valid phone number is required" });
        return;
      }

      const { date, time } = getFormattedDateTime();
      await db.collection("inquiries").add({
        firstName: sanitizeString(firstName, 100),
        lastName: sanitizeString(lastName, 100),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        product: product ? sanitizeString(product, 200) : "",
        referralSource: referralSource
          ? sanitizeString(referralSource, 200)
          : "",
        subscribedToNewsletter: !!subscribedToNewsletter,
        comments: comments ? sanitizeString(comments, 1000) : "",
        date,
        time,
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({ success: true, message: "Inquiry submitted successfully!" });
    } catch (error) {
      console.error("Error in buyMeatSubmit:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to submit. Please try again." });
    }
  },
);

// ---------------------------------------------------------------------------
// getEvents
// ---------------------------------------------------------------------------
export const getEvents = onRequest(
  { cors: false, memory: "256MiB", timeoutSeconds: 60 },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "GET")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const snapshot = await db
        .collection("events")
        .where("active", "==", true)
        .get();
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json({ success: true, events });
    } catch (error) {
      console.error("Error in getEvents:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to retrieve events.",
          events: [],
        });
    }
  },
);

// ---------------------------------------------------------------------------
// addEvent
// ---------------------------------------------------------------------------
export const addEvent = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password, name, date, time, type } = req.body;

      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!name || typeof name !== "string" || name.trim() === "") {
        res
          .status(400)
          .json({ success: false, error: "Event name is required" });
        return;
      }
      if (!date || typeof date !== "string" || date.trim() === "") {
        res
          .status(400)
          .json({ success: false, error: "Event date is required" });
        return;
      }

      const ref = await db.collection("events").add({
        name: sanitizeString(name, 200),
        date: sanitizeString(date, 50),
        time: time ? sanitizeString(time, 50) : "",
        type: type ? sanitizeString(type, 100) : "",
        active: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({
        success: true,
        message: "Event added successfully",
        event: { id: ref.id, name, date, time, type },
      });
    } catch (error) {
      console.error("Error in addEvent:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to add event. Please try again.",
        });
    }
  },
);

// ---------------------------------------------------------------------------
// deleteEvent
// ---------------------------------------------------------------------------
export const deleteEvent = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password, id } = req.body;

      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!id || typeof id !== "string") {
        res.status(400).json({ success: false, error: "Event ID is required" });
        return;
      }

      const ref = db.collection("events").doc(id);
      const doc = await ref.get();
      if (!doc.exists) {
        res.status(404).json({ success: false, error: "Event not found" });
        return;
      }

      await ref.update({ active: false });
      res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error in deleteEvent:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to delete event. Please try again.",
        });
    }
  },
);

// ---------------------------------------------------------------------------
// getProducts
// ---------------------------------------------------------------------------
export const getProducts = onRequest(
  { cors: false, memory: "256MiB", timeoutSeconds: 60 },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "GET")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const snapshot = await db
        .collection("products")
        .where("active", "==", true)
        .get();
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json({ success: true, products });
    } catch (error) {
      console.error("Error in getProducts:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to retrieve products.",
          products: [],
        });
    }
  },
);

// ---------------------------------------------------------------------------
// getBooks
// ---------------------------------------------------------------------------
export const getBooks = onRequest(
  { cors: false, memory: "256MiB", timeoutSeconds: 60 },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "GET")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const snapshot = await db
        .collection("books")
        .where("active", "==", true)
        .get();
      const books = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, books });
    } catch (error) {
      console.error("Error in getBooks:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to retrieve books.",
          books: [],
        });
    }
  },
);

// ---------------------------------------------------------------------------
// addProduct
// ---------------------------------------------------------------------------
export const addProduct = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const {
        password,
        category,
        name,
        description,
        price,
        quantity,
        unit,
        imageUrl,
      } = req.body;

      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!category || !["meat", "merchandise"].includes(category)) {
        res
          .status(400)
          .json({
            success: false,
            error: 'Category must be "meat" or "merchandise"',
          });
        return;
      }
      if (!name || typeof name !== "string" || name.trim() === "") {
        res
          .status(400)
          .json({ success: false, error: "Product name is required" });
        return;
      }
      if (
        price === undefined ||
        isNaN(parseFloat(price)) ||
        parseFloat(price) < 0
      ) {
        res
          .status(400)
          .json({ success: false, error: "Valid price is required" });
        return;
      }
      if (
        quantity === undefined ||
        isNaN(parseFloat(quantity)) ||
        parseFloat(quantity) < 0
      ) {
        res
          .status(400)
          .json({ success: false, error: "Valid quantity is required" });
        return;
      }

      const data = {
        category: sanitizeString(category, 50),
        name: sanitizeString(name, 200),
        description: description ? sanitizeString(description, 500) : "",
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        unit: unit
          ? sanitizeString(unit, 20)
          : category === "meat"
            ? "lb"
            : "item",
        imageUrl: imageUrl ? sanitizeString(imageUrl, 500) : "",
        active: true,
        createdAt: FieldValue.serverTimestamp(),
      };

      const ref = await db.collection("products").add(data);

      res.json({
        success: true,
        message: "Successfully added product",
        product: { id: ref.id, ...data },
      });
    } catch (error) {
      console.error("Error in addProduct:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to add product. Please try again.",
        });
    }
  },
);

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------
export const updateProduct = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const {
        password,
        id,
        category,
        name,
        description,
        price,
        quantity,
        unit,
        imageUrl,
      } = req.body;

      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!id || typeof id !== "string") {
        res
          .status(400)
          .json({ success: false, error: "Product ID is required" });
        return;
      }

      const ref = db.collection("products").doc(id);
      const doc = await ref.get();
      if (!doc.exists) {
        res.status(404).json({ success: false, error: "Product not found" });
        return;
      }

      const updates = {};
      if (category !== undefined)
        updates.category = sanitizeString(category, 50);
      if (name !== undefined) updates.name = sanitizeString(name, 200);
      if (description !== undefined)
        updates.description = sanitizeString(description, 500);
      if (price !== undefined) updates.price = parseFloat(price);
      if (quantity !== undefined) updates.quantity = parseFloat(quantity);
      if (unit !== undefined) updates.unit = sanitizeString(unit, 20);
      if (imageUrl !== undefined)
        updates.imageUrl = sanitizeString(imageUrl, 500);
      updates.updatedAt = FieldValue.serverTimestamp();

      await ref.update(updates);
      res.json({ success: true, message: "Product updated successfully" });
    } catch (error) {
      console.error("Error in updateProduct:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to update product. Please try again.",
        });
    }
  },
);

// ---------------------------------------------------------------------------
// deleteProduct
// ---------------------------------------------------------------------------
export const deleteProduct = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password, id } = req.body;

      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!id || typeof id !== "string") {
        res
          .status(400)
          .json({ success: false, error: "Product ID is required" });
        return;
      }

      const ref = db.collection("products").doc(id);
      const doc = await ref.get();
      if (!doc.exists) {
        res.status(404).json({ success: false, error: "Product not found" });
        return;
      }

      await ref.update({
        active: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to delete product. Please try again.",
        });
    }
  },
);

// ---------------------------------------------------------------------------
// addBook
// ---------------------------------------------------------------------------
export const addBook = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password, title, author, externalUrl, imageUrl } = req.body;

      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!title || typeof title !== "string" || title.trim() === "") {
        res
          .status(400)
          .json({ success: false, error: "Book title is required" });
        return;
      }
      if (!author || typeof author !== "string" || author.trim() === "") {
        res.status(400).json({ success: false, error: "Author is required" });
        return;
      }
      if (
        !externalUrl ||
        typeof externalUrl !== "string" ||
        externalUrl.trim() === ""
      ) {
        res
          .status(400)
          .json({ success: false, error: "External URL is required" });
        return;
      }

      const data = {
        title: sanitizeString(title, 200),
        author: sanitizeString(author, 200),
        externalUrl: sanitizeString(externalUrl, 500),
        imageUrl: imageUrl ? sanitizeString(imageUrl, 500) : "",
        active: true,
        createdAt: FieldValue.serverTimestamp(),
      };

      const ref = await db.collection("books").add(data);

      res.json({
        success: true,
        message: "Successfully added book",
        book: { id: ref.id, ...data },
      });
    } catch (error) {
      console.error("Error in addBook:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to add book. Please try again.",
        });
    }
  },
);

// ---------------------------------------------------------------------------
// updateBook
// ---------------------------------------------------------------------------
export const updateBook = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password, id, title, author, externalUrl, imageUrl } = req.body;

      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!id || typeof id !== "string") {
        res.status(400).json({ success: false, error: "Book ID is required" });
        return;
      }

      const ref = db.collection("books").doc(id);
      const doc = await ref.get();
      if (!doc.exists) {
        res.status(404).json({ success: false, error: "Book not found" });
        return;
      }

      const updates = {};
      if (title !== undefined) updates.title = sanitizeString(title, 200);
      if (author !== undefined) updates.author = sanitizeString(author, 200);
      if (externalUrl !== undefined)
        updates.externalUrl = sanitizeString(externalUrl, 500);
      if (imageUrl !== undefined)
        updates.imageUrl = sanitizeString(imageUrl, 500);
      updates.updatedAt = FieldValue.serverTimestamp();

      await ref.update(updates);
      res.json({ success: true, message: "Book updated successfully" });
    } catch (error) {
      console.error("Error in updateBook:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to update book. Please try again.",
        });
    }
  },
);

// ---------------------------------------------------------------------------
// deleteBook
// ---------------------------------------------------------------------------
export const deleteBook = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password, id } = req.body;

      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!id || typeof id !== "string") {
        res.status(400).json({ success: false, error: "Book ID is required" });
        return;
      }

      const ref = db.collection("books").doc(id);
      const doc = await ref.get();
      if (!doc.exists) {
        res.status(404).json({ success: false, error: "Book not found" });
        return;
      }

      await ref.update({
        active: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
      res.json({ success: true, message: "Book deleted successfully" });
    } catch (error) {
      console.error("Error in deleteBook:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to delete book. Please try again.",
        });
    }
  },
);

// ---------------------------------------------------------------------------
// submitOrder
// ---------------------------------------------------------------------------
export const submitOrder = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [recaptchaSecretKey],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zip,
        productId,
        quantity,
        recaptchaToken,
      } = req.body;

      const recaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        recaptchaSecretKey.value(),
        "order_submit",
        0.5,
      );
      if (!recaptchaResult.success) {
        res
          .status(400)
          .json({
            success: false,
            error: "Bot detection failed. Please try again.",
          });
        return;
      }

      if (
        !firstName ||
        typeof firstName !== "string" ||
        firstName.trim() === ""
      ) {
        res
          .status(400)
          .json({ success: false, error: "First name is required" });
        return;
      }
      if (!lastName || typeof lastName !== "string" || lastName.trim() === "") {
        res
          .status(400)
          .json({ success: false, error: "Last name is required" });
        return;
      }
      if (!email || !isValidEmail(email.trim())) {
        res
          .status(400)
          .json({ success: false, error: "Valid email is required" });
        return;
      }
      if (!phone || !isValidPhone(phone.trim())) {
        res
          .status(400)
          .json({ success: false, error: "Valid phone is required" });
        return;
      }
      if (!address || typeof address !== "string" || address.trim() === "") {
        res.status(400).json({ success: false, error: "Address is required" });
        return;
      }
      if (!city || typeof city !== "string" || city.trim() === "") {
        res.status(400).json({ success: false, error: "City is required" });
        return;
      }
      if (!state || typeof state !== "string" || state.trim() === "") {
        res.status(400).json({ success: false, error: "State is required" });
        return;
      }
      if (!zip || typeof zip !== "string" || zip.trim() === "") {
        res.status(400).json({ success: false, error: "ZIP code is required" });
        return;
      }
      if (!productId || typeof productId !== "string") {
        res
          .status(400)
          .json({ success: false, error: "Product ID is required" });
        return;
      }
      if (!quantity || typeof quantity !== "number" || quantity <= 0) {
        res
          .status(400)
          .json({ success: false, error: "Valid quantity is required" });
        return;
      }

      const { date, time } = getFormattedDateTime();

      // Use a transaction to check inventory and decrement atomically
      const result = await db.runTransaction(async (transaction) => {
        const productRef = db.collection("products").doc(productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists || !productDoc.data().active) {
          throw Object.assign(new Error("Product not found"), {
            statusCode: 404,
          });
        }

        const productData = productDoc.data();
        const availableQty = productData.quantity || 0;

        if (quantity > availableQty) {
          throw Object.assign(
            new Error(
              `Insufficient inventory. Only ${availableQty} available.`,
            ),
            { statusCode: 400 },
          );
        }

        const pricePerUnit = productData.price || 0;
        const total = pricePerUnit * quantity;

        const orderRef = db.collection("orders").doc();
        transaction.set(orderRef, {
          firstName: sanitizeString(firstName, 100),
          lastName: sanitizeString(lastName, 100),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          address: sanitizeString(address, 200),
          city: sanitizeString(city, 100),
          state: sanitizeString(state, 50),
          zip: sanitizeString(zip, 20),
          productId,
          productName: productData.name,
          quantity,
          pricePerUnit,
          total,
          status: "pending",
          date,
          time,
          createdAt: FieldValue.serverTimestamp(),
        });

        transaction.update(productRef, { quantity: availableQty - quantity });

        return { orderId: orderRef.id, total };
      });

      res.json({
        success: true,
        message: "Order submitted successfully!",
        orderId: result.orderId,
        total: result.total.toFixed(2),
      });
    } catch (error) {
      console.error("Error in submitOrder:", error);
      if (error.statusCode === 404) {
        res.status(404).json({ success: false, error: error.message });
      } else if (error.statusCode === 400) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res
          .status(500)
          .json({
            success: false,
            error: "Failed to submit order. Please try again.",
          });
      }
    }
  },
);

// ---------------------------------------------------------------------------
// getOrders (admin)
// ---------------------------------------------------------------------------
export const getOrders = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password } = req.body;

      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }

      const snapshot = await db
        .collection("orders")
        .orderBy("createdAt", "desc")
        .get();
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({ success: true, orders });
    } catch (error) {
      console.error("Error in getOrders:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to retrieve orders.",
          orders: [],
        });
    }
  },
);

// ---------------------------------------------------------------------------
// getLeads (admin) — recipe/waitlist signups
// ---------------------------------------------------------------------------
export const getLeads = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password } = req.body;
      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }

      const snapshot = await db
        .collection("leads")
        .orderBy("createdAt", "desc")
        .get();
      const leads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, leads });
    } catch (error) {
      console.error("Error in getLeads:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to retrieve leads.",
          leads: [],
        });
    }
  },
);

// ---------------------------------------------------------------------------
// getContacts (admin) — contact form submissions
// ---------------------------------------------------------------------------
export const getContacts = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password } = req.body;
      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }

      const snapshot = await db
        .collection("contacts")
        .orderBy("createdAt", "desc")
        .get();
      const contacts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json({ success: true, contacts });
    } catch (error) {
      console.error("Error in getContacts:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to retrieve contacts.",
          contacts: [],
        });
    }
  },
);

// ---------------------------------------------------------------------------
// getInquiries (admin) — buy meat / product inquiries
// ---------------------------------------------------------------------------
export const getInquiries = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password } = req.body;
      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }

      const snapshot = await db
        .collection("inquiries")
        .orderBy("createdAt", "desc")
        .get();
      const inquiries = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json({ success: true, inquiries });
    } catch (error) {
      console.error("Error in getInquiries:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to retrieve inquiries.",
          inquiries: [],
        });
    }
  },
);

// ---------------------------------------------------------------------------
// getBookImageUploadUrl (admin) — returns a signed URL for uploading a book cover
// ---------------------------------------------------------------------------
export const getBookImageUploadUrl = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;

    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res
        .status(429)
        .json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      return;
    }

    try {
      const { password, filename, contentType } = req.body;

      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }

      if (!filename || typeof filename !== "string") {
        res.status(400).json({ success: false, error: "filename is required" });
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      const mimeType = allowedTypes.includes(contentType)
        ? contentType
        : "image/jpeg";

      // Sanitize filename — keep extension, replace everything else
      const ext =
        filename
          .split(".")
          .pop()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "jpg";
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const storagePath = `books/${safeName}`;

      const bucket = storage.bucket(
        "homecoming-ranch-1c2d9.firebasestorage.app",
      );
      const file = bucket.file(storagePath);

      const [signedUrl] = await file.getSignedUrl({
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: mimeType,
      });

      const encodedPath = encodeURIComponent(storagePath);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/homecoming-ranch-1c2d9.firebasestorage.app/o/${encodedPath}?alt=media`;

      res.json({ success: true, signedUrl, publicUrl, storagePath });
    } catch (error) {
      console.error("Error in getBookImageUploadUrl:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to generate upload URL." });
    }
  },
);

// ---------------------------------------------------------------------------
// getExperiences — public
// ---------------------------------------------------------------------------
export const getExperiences = onRequest(
  { cors: false, memory: "256MiB", timeoutSeconds: 60 },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "GET")) return;
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res.status(429).json({ success: false, error: "Too many requests." });
      return;
    }
    try {
      const snapshot = await db
        .collection("experiences")
        .where("active", "==", true)
        .orderBy("order", "asc")
        .get();
      const experiences = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json({ success: true, experiences });
    } catch (error) {
      console.error("Error in getExperiences:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to retrieve experiences.",
          experiences: [],
        });
    }
  },
);

// ---------------------------------------------------------------------------
// addExperience — admin
// ---------------------------------------------------------------------------
export const addExperience = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: "Too many requests." });
      return;
    }
    try {
      const {
        password,
        title,
        subtitle,
        badge,
        description,
        includes,
        pricing,
        formFields,
        imageUrl,
        imageAlt,
        order,
      } = req.body;
      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!title || typeof title !== "string" || title.trim() === "") {
        res.status(400).json({ success: false, error: "Title is required" });
        return;
      }
      const data = {
        title: sanitizeString(title, 200),
        subtitle: subtitle ? sanitizeString(subtitle, 200) : "",
        badge: badge ? sanitizeString(badge, 100) : null,
        description: description ? sanitizeString(description, 2000) : "",
        includes: Array.isArray(includes)
          ? includes.map((i) => sanitizeString(i, 200))
          : [],
        pricing: Array.isArray(pricing)
          ? pricing.map((p) => ({
              label: sanitizeString(p.label || "", 100),
              price: sanitizeString(p.price || "", 50),
            }))
          : [],
        formFields: {
          adults: !!formFields?.adults,
          children: !!formFields?.children,
          groupSize: !!formFields?.groupSize,
          school: !!formFields?.school,
        },
        imageUrl: imageUrl ? sanitizeString(imageUrl, 500) : "",
        imageAlt: imageAlt ? sanitizeString(imageAlt, 300) : "",
        order: typeof order === "number" ? order : 99,
        active: true,
        createdAt: FieldValue.serverTimestamp(),
      };
      const ref = await db.collection("experiences").add(data);
      res.json({
        success: true,
        message: "Experience added",
        experience: { id: ref.id, ...data },
      });
    } catch (error) {
      console.error("Error in addExperience:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to add experience." });
    }
  },
);

// ---------------------------------------------------------------------------
// updateExperience — admin
// ---------------------------------------------------------------------------
export const updateExperience = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: "Too many requests." });
      return;
    }
    try {
      const {
        password,
        id,
        title,
        subtitle,
        badge,
        description,
        includes,
        pricing,
        formFields,
        imageUrl,
        imageAlt,
        order,
      } = req.body;
      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!id || typeof id !== "string") {
        res
          .status(400)
          .json({ success: false, error: "Experience ID is required" });
        return;
      }
      const ref = db.collection("experiences").doc(id);
      const doc = await ref.get();
      if (!doc.exists) {
        res.status(404).json({ success: false, error: "Experience not found" });
        return;
      }
      const updates = { updatedAt: FieldValue.serverTimestamp() };
      if (title !== undefined) updates.title = sanitizeString(title, 200);
      if (subtitle !== undefined)
        updates.subtitle = sanitizeString(subtitle, 200);
      if (badge !== undefined)
        updates.badge = badge ? sanitizeString(badge, 100) : null;
      if (description !== undefined)
        updates.description = sanitizeString(description, 2000);
      if (includes !== undefined)
        updates.includes = Array.isArray(includes)
          ? includes.map((i) => sanitizeString(i, 200))
          : [];
      if (pricing !== undefined)
        updates.pricing = Array.isArray(pricing)
          ? pricing.map((p) => ({
              label: sanitizeString(p.label || "", 100),
              price: sanitizeString(p.price || "", 50),
            }))
          : [];
      if (formFields !== undefined)
        updates.formFields = {
          adults: !!formFields?.adults,
          children: !!formFields?.children,
          groupSize: !!formFields?.groupSize,
          school: !!formFields?.school,
        };
      if (imageUrl !== undefined)
        updates.imageUrl = sanitizeString(imageUrl, 500);
      if (imageAlt !== undefined)
        updates.imageAlt = sanitizeString(imageAlt, 300);
      if (order !== undefined)
        updates.order = typeof order === "number" ? order : 99;
      await ref.update(updates);
      res.json({ success: true, message: "Experience updated" });
    } catch (error) {
      console.error("Error in updateExperience:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update experience." });
    }
  },
);

// ---------------------------------------------------------------------------
// deleteExperience — admin (soft delete)
// ---------------------------------------------------------------------------
export const deleteExperience = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: "Too many requests." });
      return;
    }
    try {
      const { password, id } = req.body;
      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!id || typeof id !== "string") {
        res
          .status(400)
          .json({ success: false, error: "Experience ID is required" });
        return;
      }
      const ref = db.collection("experiences").doc(id);
      const doc = await ref.get();
      if (!doc.exists) {
        res.status(404).json({ success: false, error: "Experience not found" });
        return;
      }
      await ref.update({
        active: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
      res.json({ success: true, message: "Experience deleted" });
    } catch (error) {
      console.error("Error in deleteExperience:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete experience." });
    }
  },
);

// ---------------------------------------------------------------------------
// getExperienceImageUploadUrl — admin, signed upload URL for Storage
// ---------------------------------------------------------------------------
export const getExperienceImageUploadUrl = onRequest(
  {
    cors: false,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [adminPassword],
  },
  async (req, res) => {
    if (!handleCorsAndMethod(req, res, "POST")) return;
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: "Too many requests." });
      return;
    }
    try {
      const { password, filename, contentType } = req.body;
      if (
        !password ||
        !validateAdminPassword(password, adminPassword.value())
      ) {
        res
          .status(401)
          .json({ success: false, error: "Invalid admin password" });
        return;
      }
      if (!filename || typeof filename !== "string") {
        res.status(400).json({ success: false, error: "filename is required" });
        return;
      }
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      const mimeType = allowedTypes.includes(contentType)
        ? contentType
        : "image/jpeg";
      const ext =
        filename
          .split(".")
          .pop()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "jpg";
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const storagePath = `experiences/${safeName}`;
      const bucket = storage.bucket(
        "homecoming-ranch-1c2d9.firebasestorage.app",
      );
      const file = bucket.file(storagePath);
      const [signedUrl] = await file.getSignedUrl({
        action: "write",
        expires: Date.now() + 15 * 60 * 1000,
        contentType: mimeType,
      });
      const encodedPath = encodeURIComponent(storagePath);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/homecoming-ranch-1c2d9.firebasestorage.app/o/${encodedPath}?alt=media`;
      res.json({ success: true, signedUrl, publicUrl, storagePath });
    } catch (error) {
      console.error("Error in getExperienceImageUploadUrl:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to generate upload URL." });
    }
  },
);
