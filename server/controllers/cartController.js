import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const syncCart = async (req, res) => {
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
      cart = new Cart({
        userId,
        items: [],
      });
    }

    // Combine existing DB cart + guest cart
    const mergedQuantities = new Map();

    for (const item of cart.items) {
      mergedQuantities.set(item.productId.toString(), item.quantity);
    }

    for (const item of items) {
      if (!item?.productId || !Number.isInteger(item.quantity)) {
        continue;
      }

      if (item.quantity < 1) {
        continue;
      }

      const productId = item.productId.toString();

      mergedQuantities.set(
        productId,
        (mergedQuantities.get(productId) || 0) + item.quantity,
      );
    }

    const productIds = [...mergedQuantities.keys()];

    if (productIds.length === 0) {
      cart.items = [];
      await cart.save();

      return res.status(200).json({
        success: true,
        message: "Cart synchronized.",
        cart: {
          items: [],
        },
      });
    }

    // Fetch only active products
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select("name slug price originalPrice images stock")
      .lean();

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    const finalItems = [];

    for (const productId of productIds) {
      const product = productMap.get(productId);

      // Product deleted/inactive
      if (!product) {
        continue;
      }

      const requestedQuantity = mergedQuantities.get(productId);

      // Product out of stock
      if (product.stock <= 0) {
        continue;
      }

      const quantity = Math.min(requestedQuantity, product.stock);

      finalItems.push({
        productId: product._id,
        quantity,
      });
    }

    cart.items = finalItems;

    await cart.save();

    // Return authoritative cart with current product data
    const responseItems = finalItems
      .map((item) => {
        const product = productMap.get(item.productId.toString());

        if (!product) {
          return null;
        }

        return {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images || [],
          stock: product.stock,
          quantity: item.quantity,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      message: "Cart synchronized successfully.",
      cart: {
        items: responseItems,
      },
    });
  } catch (error) {
    console.error("Sync cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to synchronize cart.",
    });
  }
};

export const updateCart = async (req, res) => {
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
      cart = new Cart({
        userId,
        items: [],
      });
    }

    const requestedItems = new Map();

    for (const item of items) {
      if (!item?.productId || !Number.isInteger(item.quantity)) {
        continue;
      }

      if (item.quantity < 1) {
        continue;
      }

      requestedItems.set(item.productId.toString(), item.quantity);
    }

    const productIds = [...requestedItems.keys()];

    if (productIds.length === 0) {
      cart.items = [];
      await cart.save();

      return res.status(200).json({
        success: true,
        message: "Cart updated successfully.",
        cart: {
          items: [],
        },
      });
    }

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select("name slug price originalPrice images stock")
      .lean();

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    const finalItems = [];

    //   Validate every requested item against current stock.
    for (const productId of productIds) {
      const product = productMap.get(productId);

      if (!product) {
        continue;
      }

      if (product.stock <= 0) {
        continue;
      }

      const requestedQuantity = requestedItems.get(productId);

      // Never allow cart quantity above current stock.
      const quantity = Math.min(requestedQuantity, product.stock);

      finalItems.push({
        productId: product._id,
        quantity,
      });
    }

    //    Replace DB cart with validated cart.
    cart.items = finalItems;
    await cart.save();

    //  Return authoritative cart data.
    const responseItems = finalItems
      .map((item) => {
        const product = productMap.get(item.productId.toString());

        if (!product) {
          return null;
        }

        return {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images || [],
          stock: product.stock,
          quantity: item.quantity,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully.",
      cart: {
        items: responseItems,
      },
    });
  } catch (error) {
    console.error("Update cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update cart.",
    });
  }
};
