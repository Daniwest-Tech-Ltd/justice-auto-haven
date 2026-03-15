import { useEffect, useState } from "react";

const MouseTracker = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let trailId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsMoving(true);

      // Add trail point
      setTrail((prev) => [
        ...prev.slice(-8),
        { x: e.clientX, y: e.clientY, id: trailId++ },
      ]);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {/* Trail effect */}
      {trail.map((point, index) => (
        <div
          key={point.id}
          className="fixed pointer-events-none z-50 rounded-full bg-gradient-primary opacity-30"
          style={{
            left: point.x - 4,
            top: point.y - 4,
            width: 8 - index * 0.5,
            height: 8 - index * 0.5,
            transition: "opacity 0.5s ease-out",
          }}
        />
      ))}

      {/* Main cursor - Tire/Wheel design */}
      <div
        className="fixed pointer-events-none z-50 transition-transform duration-100"
        style={{
          left: position.x - 20,
          top: position.y - 20,
          transform: `scale(${isMoving ? 1.2 : 1}) rotate(${position.x / 10}deg)`,
        }}
      >
        {/* Outer ring (tire) */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-gold bg-transparent" />
          
          {/* Spokes */}
          <div className="absolute inset-2 flex items-center justify-center">
            <div className="absolute w-full h-0.5 bg-gold rotate-0" />
            <div className="absolute w-full h-0.5 bg-gold rotate-45" />
            <div className="absolute w-full h-0.5 bg-gold rotate-90" />
            <div className="absolute w-full h-0.5 bg-gold -rotate-45" />
          </div>
          
          {/* Center hub */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gradient-primary" />
          </div>
        </div>
      </div>

      {/* Speed lines when moving */}
      {isMoving && (
        <>
          <div
            className="fixed pointer-events-none z-40"
            style={{
              left: position.x - 40,
              top: position.y - 2,
              width: 30,
              height: 2,
              background: "linear-gradient(to left, hsl(var(--gold)), transparent)",
              opacity: 0.6,
            }}
          />
          <div
            className="fixed pointer-events-none z-40"
            style={{
              left: position.x - 35,
              top: position.y - 6,
              width: 20,
              height: 1,
              background: "linear-gradient(to left, hsl(var(--gold)), transparent)",
              opacity: 0.4,
            }}
          />
          <div
            className="fixed pointer-events-none z-40"
            style={{
              left: position.x - 35,
              top: position.y + 4,
              width: 20,
              height: 1,
              background: "linear-gradient(to left, hsl(var(--gold)), transparent)",
              opacity: 0.4,
            }}
          />
        </>
      )}
    </>
  );
};

export default MouseTracker;
