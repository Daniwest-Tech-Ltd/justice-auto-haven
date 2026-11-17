import React, { useEffect, useRef } from 'react';

const ParticleNetwork = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    let mouse = {
      x: -9999,
      y: -9999
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5; // Professional slow movement
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1; // Bigger, clearly visible nodes
      }

      update(width: number, height: number) {
        // Magnet effect to mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 200 && mouse.x !== -9999) { // 200px strong magnet radius
           // Calculate attraction force (closer = stronger)
           const force = (200 - dist) / 200;
           // Apply a very small velocity change towards the mouse
           this.vx += (dx / dist) * force * 0.08; // Stronger magnet pull
           this.vy += (dy / dist) * force * 0.08;
        }

        // Apply friction to max speed so they don't fly off too fast
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = 1.5; // Cap the speed so it looks elegant
        if (currentSpeed > maxSpeed) {
           this.vx = (this.vx / currentSpeed) * maxSpeed;
           this.vy = (this.vy / currentSpeed) * maxSpeed;
        }

        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;

        this.x += this.vx;
        this.y += this.vy;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Made dots brighter
        ctx.fill();
      }
    }

    const init = () => {
      // Create a sensible number of particles for a card sized container
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 4000); // Super high density
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      // Clear with dark overlay for trailing effect or just clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);

        // Draw lines between particles
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) { // Increased line distance
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * (1 - dist / 100)})`; // Brighter lines
            ctx.lineWidth = 0.8; // Thicker lines
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw lines to mouse (Creating a web connecting mouse to particles)
        const dxMouse = p.x - mouse.x;
        const dyMouse = p.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < 200) { // Massive web radius for the cursor
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * (1 - distMouse / 200)})`; // Bright solid white lines for cursor web
          ctx.lineWidth = 1.2;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 mix-blend-screen opacity-70"
    />
  );
};

export default ParticleNetwork;
