"use client";

import { motion } from "framer-motion";

interface TypedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TypedText({ text, className = "", delay = 0 }: TypedTextProps) {
  const letters = text.split("");

  return (
    <motion.span className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.05,
            delay: delay + index * 0.03,
          }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  );
}
