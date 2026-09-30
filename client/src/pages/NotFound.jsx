import { Link } from "react-router-dom";
import Container from "../components/layout/Container";

function NotFound() {
  return (
    <Container>
      <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-7xl font-bold">404</p>

        <h1 className="mt-4 text-2xl font-semibold">
          Page not found
        </h1>

        <Link
          to="/"
          className="mt-6 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Back Home
        </Link>
      </section>
    </Container>
  );
}

export default NotFound;