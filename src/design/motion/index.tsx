import type { ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import {
  cardVariants,
  listContainerVariants,
  pageVariants,
  rowVariants,
} from './variants'

type MotionTag = 'div' | 'section' | 'aside' | 'tbody' | 'tr'

type MotionPrimitiveProps = {
  as?: MotionTag
  children?: ReactNode
  className?: string
  [key: string]: unknown
}

const staticComponents: Record<MotionTag, MotionTag> = {
  div: 'div',
  section: 'section',
  aside: 'aside',
  tbody: 'tbody',
  tr: 'tr',
}

const motionComponents: Record<MotionTag, React.ElementType> = {
  div: motion.div,
  section: motion.section,
  aside: motion.aside,
  tbody: motion.tbody,
  tr: motion.tr,
}

const typedCardVariants = cardVariants as unknown as Variants
const typedListContainerVariants = listContainerVariants as unknown as Variants
const typedPageVariants = pageVariants as unknown as Variants
const typedRowVariants = rowVariants as unknown as Variants

function stripMotionProps(props: Record<string, unknown>) {
  const {
    animate,
    exit,
    initial,
    layout,
    transition,
    variants,
    viewport,
    whileHover,
    whileInView,
    whileTap,
    ...domProps
  } = props

  return domProps
}

export function MotionPage({ children, className, ...props }: MotionPrimitiveProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className} {...stripMotionProps(props)}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={typedPageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function MotionCard({
  children,
  className,
  as = 'div',
  ...props
}: MotionPrimitiveProps) {
  const reduceMotion = useReducedMotion()
  const StaticComponent = staticComponents[as]
  const MotionComponent = motionComponents[as]

  if (reduceMotion) {
    return <StaticComponent className={className} {...stripMotionProps(props)}>{children}</StaticComponent>
  }

  return (
    <MotionComponent
      className={className}
      variants={typedCardVariants}
      initial="initial"
      animate="animate"
      {...props}
    >
      {children}
    </MotionComponent>
  )
}

export function MotionList({
  children,
  className,
  as = 'div',
  ...props
}: MotionPrimitiveProps) {
  const reduceMotion = useReducedMotion()
  const StaticComponent = staticComponents[as]
  const MotionComponent = motionComponents[as]

  if (reduceMotion) {
    return <StaticComponent className={className} {...stripMotionProps(props)}>{children}</StaticComponent>
  }

  return (
    <MotionComponent
      className={className}
      variants={typedListContainerVariants}
      initial="initial"
      animate="animate"
      {...props}
    >
      {children}
    </MotionComponent>
  )
}

export function MotionRow({
  children,
  className,
  as = 'div',
  ...props
}: MotionPrimitiveProps) {
  const reduceMotion = useReducedMotion()
  const StaticComponent = staticComponents[as]
  const MotionComponent = motionComponents[as]

  if (reduceMotion) {
    return <StaticComponent className={className} {...stripMotionProps(props)}>{children}</StaticComponent>
  }

  return (
    <MotionComponent
      className={className}
      variants={typedRowVariants}
      initial="initial"
      animate="animate"
      {...props}
    >
      {children}
    </MotionComponent>
  )
}

export * from './variants'
