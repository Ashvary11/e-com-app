import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CircularCarousel from "./CircularCarousel";
import api from "@/services/api";

function CartCarousel() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await api.get("/products", {
          params: {
            sort: "rating",
            page: 1,
            limit: 50,
          },
        });

        const products = res.data.products || [];

        const randomProducts = [...products]
          .filter((product) => product.rating >= 4)
          .sort(() => Math.random() - 0.5)
          .slice(0, 18);

        const items = randomProducts.map((product) => ({
          id: product._id,
          slug: product.slug,
          src: product.images[0],
          alt: product.name || product.title,
          title: product.name || product.title,
          subtitle: product.category,
        }));
        setItems(items);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchItems();
  }, []);

  const handleProductClick = (product) => {
    setTimeout(() => {
      navigate(`/products/${product.slug || product.id}`);
    }, 2000);
  };
  return <CircularCarousel autoplay="off" items={items} onItemClick={handleProductClick} />;
}

export default CartCarousel;
