import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";

const Forbidden = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-destructive/20 to-background p-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <Ban className="h-16 w-16 text-destructive" />
          </div>
        </div>
        
        <h1 className="mb-4 text-6xl font-bold text-foreground">403</h1>
        <h2 className="mb-4 text-2xl font-semibold">Access Forbidden</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          You don't have permission to access this resource. If you believe this is an error, please contact support.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link to="/">Return Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
