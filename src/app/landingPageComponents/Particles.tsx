import { motion } from "framer-motion";

export function Particles({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[2px] w-[2px] rounded-full bg-white/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
          }}
          initial={{ opacity: 0.1, scale: 1 }}
          animate={{
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.5, 1],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}
