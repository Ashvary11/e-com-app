import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop({top=0}) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top,
      left: 0,
      behavior: "instant",
    });
  }, [pathname,top]);

  return null;
}

export default ScrollToTop;