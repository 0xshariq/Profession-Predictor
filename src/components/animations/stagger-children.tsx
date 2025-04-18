"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface StaggerChildrenProps {
  children: ReactNode
  delay?: number
  staggerDelay?: number
  className?: string
}

export function StaggerChildren({ children, delay = 0, staggerDelay = 0.1, className = "" }: StaggerChildrenProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className={className}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={child?.key || `stagger-child-${index}`} variants={item}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  )
}
