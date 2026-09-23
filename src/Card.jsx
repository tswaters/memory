import cx from 'classnames'
import {
  memo,
  forwardRef,
  useRef,
  useImperativeHandle,
  useCallback,
} from 'react'

import { card, failure, success, offset } from './Card.css'

// this component is almost the antithesis of good react component. it doesn't use state at all
// if it ever re-renders, there's probably a bug somewhere with one of the props
// we keep the dom updated via refs in various web animation api handlers, and use data-* for state (failure count)
// the aria-expanded & aria-labels are technically dynamic here and could benefit from doing react things
// problem with that is one of trust - what can and will react do with this element while my transform should be playing
// I've decided in this case to not trust react with non-static data, in theory it should do nothing (and has proven to)
// this is a strange section of react lore where mutations are OK, don't need to worry about props, state or events. (it's rather nice)
// just make sure to keep track of things properly and the snakes won't jump out of pandora's box

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
        ? `${btnRef.current.dataset.label} ${btnRef.current.dataset.failures ?? ''}`
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
