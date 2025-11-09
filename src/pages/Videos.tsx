import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Videos = () => {
  const videos = [
    {
      id: 1,
      title: "Showroom Highlights",
      description: "Tour our premium showroom facilities",
      type: "local",
    },
    {
      id: 2,
      title: "Car Previews",
      description: "Featured vehicles showcase",
      type: "local",
    },
    {
      id: 3,
      title: "Vehicles On The Road",
      description: "See how the cars are!",
      type: "local",
    },
    {
      id: 4,
      title: "Featured Today @Justice Ultimate Automobiles",
      description: "Toyota Land Cruiser GR",
      type: "local",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-accent bg-clip-text text-transparent">Videos</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          🎥 Explore our video collection - local content and embedded videos from YouTube & TikTok
        </p>
        <Button size="lg">Add Video</Button>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="glass-strong rounded-2xl overflow-hidden hover:scale-105 transition-transform">
            {/* Video Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[10px] border-y-transparent ml-1"></div>
                </div>
              </div>
              <div className="absolute top-4 left-4">
                <Badge variant="secondary">{video.type}</Badge>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{video.title}</h3>
              <p className="text-sm text-muted-foreground">{video.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Videos;
