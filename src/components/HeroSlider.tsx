import { useState, useEffect } from "react";

const staticSlides = [
  '/home/b1.webp',
  '/home/b2.jpg',
  '/home/b3.jpeg',
  '/home/b4.jpg',
  '/home/b5.jpg',
  '/home/b6.jpg',
  '/home/b7.jpg',
  '/home/b8.jpg',
  '/home/b9.jpg',
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % staticSlides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      {staticSlides.map((img, index) => (
        <div
          key={img}
          className={`absolute inset-0 transition-all duration-[3000ms] ease-in-out ${
            index === currentSlide ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-105"
          }`}
        >
          <img
            src={img}
            alt={`Slide ${index + 1}`}
            className="w-full h-full object-cover object-center grayscale-[10%] contrast-[1.2] brightness-[0.55]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>
      ))}
    </div>
  );
};

export default HeroSlider;
