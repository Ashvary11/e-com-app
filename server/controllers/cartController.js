import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const getCartResponse = async (cart) => {
  const productIds = cart.items.map((item) => item.productId);

  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  })
    .select("name slug price originalPrice images stock")
    .lean();

  const productMap = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  const items = cart.items
    .map((item) => {
      const product = productMap.get(item.productId.toString());

      if (!product || product.stock <= 0) return null;

      return {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice,
        images: product.images || [],
        stock: product.stock,
        quantity: Math.min(item.quantity, product.stock),
      };
    })
    .filter(Boolean);

  return items;
};

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { items: [] },
      });
    }

    const items = await getCartResponse(cart);

    return res.status(200).json({
      success: true,
      cart: { items },
    });
  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load cart.",
    });
  }
};

export const mergeCart = async (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart items.",
      });
    }

    const userId = req.user.id;
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const quantities = new Map();

    for (const item of cart.items) {
      quantities.set(item.productId.toString(), item.quantity);
    }

    for (const item of items) {
      if (
        !item?.productId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        continue;
      }

      const id = item.productId.toString();

      quantities.set(id, (quantities.get(id) || 0) + item.quantity);
    }

    const productIds = [...quantities.keys()];

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select("_id stock")
      .lean();

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    cart.items = productIds
      .map((id) => {
        const product = productMap.get(id);

        if (!product || product.stock <= 0) return null;

        return {
          productId: product._id,
          quantity: Math.min(quantities.get(id), product.stock),
        };
      })
      .filter(Boolean);

    await cart.save();

    const responseItems = await getCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Cart merged successfully.",
      cart: { items: responseItems },
    });
  } catch (error) {
    console.error("Merge cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to merge cart.",
    });
  }
};

export const updateCart = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart items.",
      });
    }

    const userId = req.user.id;
    const quantities = new Map();

    // Validate items and combine duplicate product IDs.
    for (const item of items) {
      if (
        !item?.productId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or quantity.",
        });
      }

      const id = item.productId.toString();

      quantities.set(id, (quantities.get(id) || 0) + item.quantity);
    }

    const productIds = [...quantities.keys()];

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select("_id stock")
      .lean();

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    // Keep only active products and enforce stock limits.
    const updatedItems = productIds
      .map((id) => {
        const product = productMap.get(id);

        if (!product || product.stock <= 0) {
          return null;
        }

        return {
          productId: product._id,
          quantity: Math.min(quantities.get(id), product.stock),
        };
      })
      .filter(Boolean);

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: updatedItems });
    } else {
      cart.items = updatedItems;
    }

    await cart.save();

    const responseItems = await getCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully.",
      cart: { items: responseItems },
    });
  } catch (error) {
    console.error("Update cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update cart.",
    });
  }
};
