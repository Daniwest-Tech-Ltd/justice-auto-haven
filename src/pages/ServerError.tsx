import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ServerCrash } from "lucide-react";

const ServerError = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-destructive/20 to-background p-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ServerCrash className="h-16 w-16 text-destructive" />
          </div>
        </div>
        
        <h1 className="mb-4 text-6xl font-bold text-foreground">500</h1>
        <h2 className="mb-4 text-2xl font-semibold">Internal Server Error</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Something went wrong on our end. We're working to fix it. Please try again later.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
