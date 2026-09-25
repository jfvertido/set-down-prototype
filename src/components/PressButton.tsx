import { motion, type HTMLMotionProps } from 'motion/react'
import { stages, type StageId } from '../design/tokens'

interface Props extends HTMLMotionProps<'button'> {
  stage: StageId
  variant?: 'primary' | 'quiet'
}

// Press feedback on the stage's micro clock: a small scale-down with no overshoot.
// MotionConfig reducedMotion="user" drops the scale for people who've asked for less motion.
export function PressButton({ stage, variant = 'primary', className, ...props }: Props) {
  const t = stages[stage]
  return (
    <motion.button
      className={['btn', variant, className].filter(Boolean).join(' ')}
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: t.micro / 1000, ease: t.ease }}
      {...props}
    />
  )
}
