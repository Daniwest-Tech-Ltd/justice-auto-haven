import heroImage from "@/assets/hero-car.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      
      {/* Hero image */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          {/* Main heading */}
          <h1 className="mb-6 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="bg-gradient-accent bg-clip-text text-transparent animate-glow-pulse">
              Justice Ultimate
            </span>
            <br />
            <span className="text-foreground">Automobiles</span>
          </h1>
          
          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light tracking-wide">
            Experience the pinnacle of automotive excellence
          </p>

          {/* Decorative line */}
          <div className="mt-8 mx-auto w-24 h-1 bg-gradient-accent rounded-full" />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-0" />
    </div>
  );
};

export default Index;
