import cx from 'classnames'
import {
  memo,
  forwardRef,
  useRef,
  useImperativeHandle,
  useCallback,
} from 'react'

import { card, failure, success, offset } from './Card.css'

const _Card = forwardRef(function Card({ onReveal, ...props }, forwardRef) {
  const rotatedRef = useRef(false)
  const flippedRef = useRef(false)

  useImperativeHandle(forwardRef, () => {
    return {
      rotate() {
        return rotateAnimation().finished
      },
      fail(_disable = false) {
        btnRef.current.classList.add(failure)
        return pulseAnimation()
          .finished.then(() => {
            btnRef.current.classList.remove(failure)
            btnRef.current.disabled = _disable
            return flipAnimation(false).finished
          })
          .then(() => {
            const fails = parseInt(btnRef.current.dataset.failures ?? '0')
            btnRef.current.dataset.failures = fails + 1
          })
      },
      success(_disable = true) {
        btnRef.current.classList.add(success)
        btnRef.current.disabled = true
        return pulseAnimation().finished.then(() => {
          btnRef.current.classList.remove(success)
          btnRef.current.disabled = _disable
          return parseInt(btnRef.current.dataset.failures ?? '0')
        })
      },
    }
  })

  const btnRef = useRef(null)

  function pulseAnimation() {
    const animation = btnRef.current.animate(
      [
        { offset: 0.0, transform: 'scale(1)' },
        { offset: 0.5, transform: 'scale(1.1)' },
        { offset: 1.0, transform: 'scale(1)' },
      ],
      { duration: 200, composite: 'add', id: 'pulse' },
    )
    return animation
  }

  function rotateAnimation(shouldRotate = !rotatedRef.current) {
    const spec = !shouldRotate ? '0' : '180'
    rotatedRef.current = !rotatedRef.current

    const animation = btnRef.current.animate(
      { transform: `rotate(${spec}deg)` },
      { duration: 500, composite: 'add', id: 'rotate' },
    )

    btnRef.current.classList.remove(offset)
    animation.finished.then(() => {
      if (flippedRef.current) btnRef.current.classList.add(offset)
      animation.commitStyles()
    })

    return animation
  }

  function flipAnimation(shouldFlip = !flippedRef.current) {
    const prevDisabled = btnRef.current.disabled
    btnRef.current.disabled = true

    const spec = !shouldFlip ? '0' : '180'
    flippedRef.current = !flippedRef.current

    const animation = btnRef.current.animate(
      { transform: `rotateY(${spec}deg)` },
      { duration: 500, id: 'flip' },
    )

    animation.finished.then(() => {
      animation.commitStyles()
      btnRef.current.ariaExpanded = flippedRef.current
      btnRef.current.ariaLabel = flippedRef.current
        ? btnRef.current.dataset.label
        : 'Card'
      btnRef.current.disabled = prevDisabled
    })

    return animation
  }

  const handleClick = useCallback(
    (e) => {
      if (btnRef.current.disabled) return
      e.persist()
      flipAnimation().finished.then(() => {
        btnRef.current.disabled = true
        onReveal?.(e)
      })
    },
    [onReveal],
  )

  return (
    <button
      {...props}
      type="button"
      aria-expanded="false"
      aria-label="Card"
      className={cx(card, props.className ?? '')}
      onClick={handleClick}
      ref={btnRef}
    />
  )
})

export default memo(_Card)
