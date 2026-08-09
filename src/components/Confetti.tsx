import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface ConfettiProps {
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

export function Confetti({ count = 50, duration = 3000, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const colors = ['#fde047', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899'];
    if (onComplete) {
      setTimeout(onComplete, duration);
    }
    const newParticles = Array.from({ length: count }).map((_, i) => {
      // Create a slight burst effect from the center bottom or top? 
      // Let's do a top-down rain effect
      return {
        id: i,
        x: Math.random() * 100, // start X percentage
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5,
      };
    });
    setParticles(newParticles);
  }, [count]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ 
            top: '-5%', 
            left: `${p.x}%`, 
            rotate: p.rotation,
            scale: 0
          }}
          animate={{ 
            top: '110%', 
            rotate: p.rotation + 360 * 2 * (Math.random() > 0.5 ? 1 : -1),
            scale: 1,
          }}
          transition={{ 
            duration: Math.random() * 2 + 2.5, 
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94] // smooth curve
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size * 1.5,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}
