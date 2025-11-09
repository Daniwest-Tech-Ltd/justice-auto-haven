import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = window.location;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 to-background p-4">
      <div className="text-center">
        <h1 className="mb-4 text-9xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-3xl font-semibold">Page not found</h2>
        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Return Home
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link to="/catalogue">
              <Search className="mr-2 h-5 w-5" />
              Browse Cars
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
