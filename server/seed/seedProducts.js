import "dotenv/config";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const DUMMY_JSON_URL = "https://dummyjson.com/products?limit=0";

// Temporary demo conversion rate.
// Later, real product data will use its actual currency/pricing.
const USD_TO_INR = 90;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const createSlug = (title, id) => {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug}-${id}`;
};

const createSKU = (product) => {
  const category = product.category
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase();

  return `CS-${category}-${String(product.id).padStart(4, "0")}`;
};

const normalizeProduct = (product) => {
  const discountPercent = Number(product.discountPercentage || 0);

  const price = Number((product.price * USD_TO_INR).toFixed(2));

  const originalPrice =
    discountPercent > 0
      ? Number((price / (1 - discountPercent / 100)).toFixed(2))
      : price;

  return {
    sku: createSKU(product),

    name: product.title,

    slug: createSlug(product.title, product.id),

    description: product.description,

    price,

    originalPrice,

    category: product.category,

    brand: product.brand || "Generic",

    images:
      product.images?.length > 0
        ? product.images
        : product.thumbnail
          ? [product.thumbnail]
          : [],

    stock: Math.max(0, Number(product.stock || 0)),

    rating: Math.min(5, Math.max(0, Number(product.rating || 0))),

    reviewCount: Math.floor(Math.random() * 500) + 10,

    isActive: true,
  };
};

const seedProducts = async () => {
  try {
    await connectDB();

    console.log("📦 Fetching products from DummyJSON...");

    const response = await fetch(DUMMY_JSON_URL);

    if (!response.ok) {
      throw new Error(
        `DummyJSON request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    const products = data.products || [];

    console.log(`📥 Received ${products.length} products`);

    if (!products.length) {
      throw new Error("No products received from DummyJSON");
    }

    const normalizedProducts = products.map(normalizeProduct);

    console.log("🧹 Clearing existing products...");

    await Product.deleteMany({});

    console.log("💾 Inserting products...");

    const insertedProducts = await Product.insertMany(normalizedProducts);

    console.log(`✅ Successfully inserted ${insertedProducts.length} products`);

    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    console.log("\n📊 Products by category:");

    categoryStats.forEach((category) => {
      console.log(`   ${category._id}: ${category.count}`);
    });

    console.log("\n🎉 Product seeding completed successfully!");
  } catch (error) {
    console.error("\n❌ Product seeding failed:");
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

seedProducts();
