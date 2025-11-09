import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className={`glass-strong rounded-3xl shadow-2xl max-w-4xl w-full min-h-[600px] overflow-hidden relative transition-all duration-700 ${
          isSignUp ? "auth-panel-active" : ""
        }`}
      >
        {/* Sign In Form */}
        <div className="auth-form-container sign-in-container absolute top-0 left-0 w-1/2 h-full flex items-center justify-center z-20 transition-all duration-700">
          <form className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6 w-full max-w-md">
            <h1 className="text-4xl font-bold mb-6">Login</h1>
            <Input type="text" placeholder="Username" className="w-full" />
            <Input type="password" placeholder="Password" className="w-full" />
            <Link to="/reset-password" className="text-sm text-primary hover:underline">
              Forgot Password?
            </Link>
            <Button className="w-full">Login</Button>
            <p className="text-sm text-muted-foreground">or login with social platforms</p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                <span className="text-xs font-bold">G</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </form>
        </div>

        {/* Sign Up Form */}
        <div className="auth-form-container sign-up-container absolute top-0 left-0 w-1/2 h-full flex items-center justify-center z-10 opacity-0 transition-all duration-700">
          <form className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6 w-full max-w-md">
            <h1 className="text-4xl font-bold mb-6">Registration</h1>
            <Input type="text" placeholder="Username" className="w-full" />
            <Input type="email" placeholder="Email" className="w-full" />
            <Input type="password" placeholder="Password" className="w-full" />
            <Button className="w-full">Register</Button>
            <p className="text-sm text-muted-foreground">or register with social platforms</p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                <span className="text-xs font-bold">G</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </form>
        </div>

        {/* Overlay Container */}
        <div className="overlay-container absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 z-30">
          <div className="overlay bg-gradient-auth relative left-[-100%] h-full w-[200%] transform transition-transform duration-700 flex">
            {/* Left Overlay */}
            <div className="overlay-panel overlay-left absolute flex items-center justify-center flex-col px-12 text-center top-0 h-full w-1/2 transform transition-transform duration-700">
              <h1 className="text-4xl font-bold text-white mb-4">Welcome Back!</h1>
              <p className="text-white/90 mb-6">Already have an account?</p>
              <Button
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10"
                onClick={() => setIsSignUp(false)}
              >
                Login
              </Button>
            </div>

            {/* Right Overlay */}
            <div className="overlay-panel overlay-right absolute right-0 flex items-center justify-center flex-col px-12 text-center top-0 h-full w-1/2 transform transition-transform duration-700">
              <h1 className="text-4xl font-bold text-white mb-4">Hello, Welcome</h1>
              <p className="text-white/90 mb-6">Don't have an account?</p>
              <Button
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10"
                onClick={() => setIsSignUp(true)}
              >
                Register
              </Button>
            </div>
          </div>
        </div>

        <style>{`
          .auth-panel-active .sign-in-container {
            transform: translateX(100%);
          }
          .auth-panel-active .sign-up-container {
            transform: translateX(100%);
            opacity: 1;
            z-index: 25;
          }
          .auth-panel-active .overlay-container {
            transform: translateX(-100%);
          }
          .auth-panel-active .overlay {
            transform: translateX(50%);
          }
          .auth-panel-active .overlay-left {
            transform: translateX(0);
          }
          .auth-panel-active .overlay-right {
            transform: translateX(20%);
          }
          .overlay-left {
            transform: translateX(-20%);
          }
        `}</style>
      </div>
    </div>
  );
};

export default Auth;
