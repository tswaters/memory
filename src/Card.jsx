import cx from 'classnames'
import { memo, useRef, useImperativeHandle } from 'react'

import { card, failure, success, offset } from './Card.css'

// the sum of durations here adds an element to difficulty
// it's however long the user has to see an incorrect selection before it flips back

const DURATION_PULSE = 200
const DURATION_ROTATE = 500
const DURATION_FLIP = 500

// keep dom updated via refs in various web animation api handlers, and use data-* for state (failure count)
// enabled, disabled, aria-expanded & aria-labels are technically dynamic here and could benefit from doing react things
// problem with that is one of trust - what can and will react do with this element while my transform should be playing
// I've decided in this case to not trust react with non-static data, in theory it should do nothing (and has proven to)
// this is a strange section of react lore where mutations are OK, don't need to worry about props, state or events. (it's rather nice)
// just make sure to keep track of things properly and the snakes won't jump out of pandora's box
// the previous version was slow AF , each click required re-rendering each tile. `onReveal` can still technically call `setState`
// and it should more or less do the right thing. not calling `setState` is a choice here, the only thing that does it is updating score
// and updating score should not touch any of the cards.

const _Card = function Card({ onReveal, ref, noMotion = false, ...props }) {
  const rotatedRef = useRef(false)
  const flippedRef = useRef(false)

  useImperativeHandle(ref, () => {
    return {
      rotate() {
        return rotateAnimation()
      },
      fail(_disable = false) {
        btnRef.current.classList.add(failure)
        return pulseAnimation()
          .then(() => {
            btnRef.current.classList.remove(failure)
            btnRef.current.disabled = _disable
            return flipAnimation(false)
          })
          .then(() => {
            btnRef.current.dataset.failures =
              parseInt(btnRef.current.dataset.failures ?? '0', 10) + 1
          })
      },
      success(_disable = true) {
        btnRef.current.classList.add(success)
        btnRef.current.disabled = true
        return pulseAnimation().then(() => {
          btnRef.current.classList.remove(success)
          btnRef.current.disabled = _disable
          return parseInt(btnRef.current.dataset.failures ?? '0', 10)
        })
      },
    }
  })

  const btnRef = useRef(null)

  function pulseAnimation() {
    const { resolve, reject, promise } = Promise.withResolvers()

    if (noMotion) {
      setTimeout(resolve, DURATION_PULSE)
    } else {
      const animation = btnRef.current.animate(
        [
          { offset: 0.0, transform: 'scale(1)' },
          { offset: 0.5, transform: 'scale(1.1)' },
          { offset: 1.0, transform: 'scale(1)' },
        ],
        { duration: DURATION_PULSE, composite: 'add', id: 'pulse' },
      )
      animation.finished.then(resolve, reject)
    }

    return promise
  }

  function rotateAnimation(shouldRotate = !rotatedRef.current) {
    const { resolve, reject, promise } = Promise.withResolvers()

    const transform = `rotate(${!shouldRotate ? '0' : '180'}deg)`
    rotatedRef.current = !rotatedRef.current

    btnRef.current.classList.remove(offset)

    if (noMotion) {
      btnRef.current.style.transform = transform
      setTimeout(resolve, DURATION_ROTATE)
    } else {
      const animation = btnRef.current.animate(
        { transform },
        { duration: DURATION_ROTATE, composite: 'add', id: 'rotate' },
      )

      animation.finished
        .then(() => animation.commitStyles())
        .then(resolve, reject)
    }

    promise.then(() => {
      if (flippedRef.current) btnRef.current.classList.add(offset)
    })

    return promise
  }

  function flipAnimation(shouldFlip = !flippedRef.current) {
    const { resolve, reject, promise } = Promise.withResolvers()

    const prevDisabled = btnRef.current.disabled
    btnRef.current.disabled = true

    const transform = `rotateY(${!shouldFlip ? '0' : '180'}deg)`
    flippedRef.current = !flippedRef.current

    if (noMotion) {
      btnRef.current.style.transform = transform
      setTimeout(resolve, DURATION_FLIP)
    } else {
      const animation = btnRef.current.animate(
        { transform },
        { duration: DURATION_FLIP, id: 'flip' },
      )

      animation.finished
        .then(() => animation.commitStyles())
        .then(resolve, reject)
    }

    promise.then(() => {
      btnRef.current.ariaExpanded = flippedRef.current
      btnRef.current.ariaLabel = flippedRef.current
        ? `${btnRef.current.dataset.label} ${btnRef.current.dataset.failures ?? ''}`
        : 'Card'
      btnRef.current.disabled = prevDisabled
    })

    return promise
  }

  return (
    <button
      {...props}
      type="button"
      aria-expanded="false"
      aria-label="Card"
      className={cx(card, props.className ?? '')}
      onClick={(e) => {
        if (btnRef.current.disabled) return
        e.persist()
        flipAnimation().then(() => {
          btnRef.current.disabled = true
          return onReveal?.(e)
        })
      }}
      ref={btnRef}
    />
  )
}

export default memo(_Card)
