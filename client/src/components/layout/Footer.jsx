import Container from "./Container";

function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <Container>
        <div className="flex min-h-20 items-center justify-between gap-4 py-6 text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} CartSphere</p>

          {/* <p>Demo ecommerce project</p> */}
        </div>
      </Container>
    </footer>
  );
}

export default Footer;