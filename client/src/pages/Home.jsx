import CartCarousel from "@/components/CartCarousel";
import Container from "../components/layout/Container";
import Products from "./Products";

function Home() {
  return (
    <Container>
      <CartCarousel />
      <Products />
    </Container>
  );
}

export default Home;
