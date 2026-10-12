import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import ProductCard from "../ProductCard";

export const HoverEffect = ({ items = [], className }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item, idx) => (
        <div
          key={item._id}
          className="group relative h-full min-w-0"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Animated background follows the hovered card */}
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                layoutId="hoverBackground"
                className="absolute -inset-2 rounded-2xl bg-neutral-200/70 dark:bg-slate-800/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>

          {/* Keep the product card above the hover background */}
          <div className="relative z-10 h-full">
            <ProductCard product={item} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const Card = ({ className, children }) => {
  return (
    <div
      className={cn(
        "relative z-10 h-full w-full overflow-hidden rounded-2xl border border-transparent transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-700",
        className,
      )}
    >
      {children}
    </div>
  );
};
