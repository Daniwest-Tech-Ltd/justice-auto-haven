import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 to-background p-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <Shield className="h-16 w-16 text-destructive" />
          </div>
        </div>
        
        <h1 className="mb-4 text-6xl font-bold text-foreground">401</h1>
        <h2 className="mb-4 text-2xl font-semibold">Unauthorized Access</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          You need to be logged in to access this page. Please sign in to continue.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
