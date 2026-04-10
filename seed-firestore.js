/**
 * Run this once to seed Firestore with initial products and books.
 * Usage: node seed-firestore.js
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Use application default credentials (firebase CLI handles auth)
initializeApp({ projectId: 'homecoming-ranch-1c2d9' });
const db = getFirestore();

const products = [
  {
    category: 'meat',
    name: 'Highland Beef - Ground (1 lb)',
    description: 'Pasture-raised, grass-fed Highland ground beef. Rich flavor, no hormones or antibiotics.',
    price: 12.00,
    quantity: 50,
    unit: 'lb',
    imageUrl: '',
    active: true,
  },
  {
    category: 'meat',
    name: 'Highland Beef - Ribeye Steak',
    description: 'Grass-fed Highland ribeye steak. Full-flavored and tender.',
    price: 28.00,
    quantity: 20,
    unit: 'lb',
    imageUrl: '',
    active: true,
  },
  {
    category: 'meat',
    name: 'Dexter Beef - Ground (1 lb)',
    description: 'Pasture-raised Dexter ground beef. Lean, rich, and locally raised in Hocking Hills.',
    price: 11.00,
    quantity: 40,
    unit: 'lb',
    imageUrl: '',
    active: true,
  },
];

const books = [];

async function seed() {
  console.log('Seeding products...');
  for (const product of products) {
    const ref = await db.collection('products').add({ ...product, createdAt: new Date() });
    console.log(`  Added product: ${product.name} (${ref.id})`);
  }

  console.log('Seeding books...');
  for (const book of books) {
    const ref = await db.collection('books').add({ ...book, createdAt: new Date() });
    console.log(`  Added book: ${book.title} (${ref.id})`);
  }

  console.log('Done! You can now add/edit products via the admin panel.');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
