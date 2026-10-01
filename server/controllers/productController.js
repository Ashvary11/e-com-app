import Product from "../models/Product.js";
import mongoose from "mongoose";

export const getProducts = async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      minPrice,
      maxPrice,
      sort = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    // 1. Build filter
    const filter = {
      isActive: true,
    };
    // {
    //   isActive: true,
    //   $text: { $search: "phone" },
    //   category: "electronics",
    //   price: { $gte: 100, $lte: 500 }
    // }

    if (search.trim()) {
      filter.$text = {
        $search: search.trim(),
      };
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // 2. Sorting
    const sortOptions = {
      newest: { createdAt: -1 }, // descending
      oldest: { createdAt: 1 }, // ascending (A→Z, small→large)
      priceLow: { price: 1 }, //   small→large
      priceHigh: { price: -1 }, //  large→small
      rating: { rating: -1 }, // descending
      name: { name: 1 }, // ascending (A→Z, small→large)
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;

    // 3. Pagination
    const currentPage = Math.max(Number(page), 1);
    const perPage = Math.min(Number(limit), 100);
    const skip = (currentPage - 1) * perPage;

    // 4. Get products
    const products = await Product.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(perPage)
      .lean();

    // 5. Get total products
    const total = await Product.countDocuments(filter);

    // 6. Send response
    res.json({
      success: true,
      products,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasNextPage: currentPage * perPage < total,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// export const getProductById = async (req, res) => {
//   try {
//     const product = await Product.findOne({
//       _id: req.params.id,
//       isActive: true,
//     }).lean();

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     res.json({
//       success: true,
//       product,
//     });
//   } catch (error) {
//     console.error("Get product error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch product",
//     });
//   }
// };

export const getProductByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    // console.log(req.params);

    const query = mongoose.Types.ObjectId.isValid(identifier)
      ? { _id: identifier, isActive: true }
      : { slug: identifier, isActive: true };

    const product = await Product.findOne(query).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category", {
      isActive: true,
    });

    categories.sort((a, b) => a.localeCompare(b));

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Get product categories error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product categories",
    });
  }
};
export const getProductPriceRange = async (req, res) => {
  try {
    const result = await Product.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    const priceRange = result[0] || {
      minPrice: 0,
      maxPrice: 0,
    };

    res.json({
      success: true,
      minPrice: priceRange.minPrice,
      maxPrice: priceRange.maxPrice,
    });
  } catch (error) {
    console.error("Get product price range error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch price range",
    });
  }
};
