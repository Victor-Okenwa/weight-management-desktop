import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background">
      <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6 text-muted-foreground">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
      >
        Go to Home
      </Link>
    </div>
  );
}
