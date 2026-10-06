import Container from "../components/layout/Container";
import Products from "./Products";

function Home() {
  return (
    <Container>
      {/* <section className="py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Modern Ecommerce
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Everything you need.
            <span className="block text-blue-600">All in one store.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
            Discover products, manage your cart, and experience a modern
            ecommerce platform built with React and Node.js.
          </p>
        </div>
      </section> */}
      <Products />
    </Container>
  );
}

export default Home;
