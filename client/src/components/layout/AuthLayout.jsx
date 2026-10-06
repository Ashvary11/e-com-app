import { Link } from "react-router-dom";
import Container from "./Container";

function AuthLayout({ title, description, children, footer }) {
  return (
    <Container>
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="text-2xl font-bold tracking-tight">
              CartSphere
            </Link>

            <h1 className="mt-6 text-2xl font-semibold tracking-tight">
              {title}
            </h1>

            {description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-background p-6 shadow-sm">
            {children}
          </div>

          {footer && (
            <div className="mt-5 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </main>
    </Container>
  );
}

export default AuthLayout;
