export const easing = {
  standard: [0.22, 1, 0.36, 1],
  emphasized: [0.16, 1, 0.3, 1],
  exit: [0.7, 0, 0.84, 0],
}

export const duration = {
  fast: 0.12,
  base: 0.18,
  normal: 0.24,
  slow: 0.32,
}

export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: easing.standard } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: easing.exit } },
}

export const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: easing.standard } },
}

export const listContainerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.035,
    },
  },
}

export const rowVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: easing.standard } },
}

export const modalVariants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: easing.emphasized } },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.14, ease: easing.exit } },
}

export const drawerVariants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { duration: 0.28, ease: easing.emphasized } },
  exit: { x: '100%', transition: { duration: 0.2, ease: easing.exit } },
}
