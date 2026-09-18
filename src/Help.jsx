import { useRef, useState, useCallback } from 'react'
import { Card } from './Card'
import { offset } from './Card.css'

export function Help() {
  const card1Ref = useRef(null)
  const card2Ref = useRef(null)
  const card3Ref = useRef(null)
  const card4Ref = useRef(null)
  const card5Ref = useRef(null)

  const correctClickCountRef = useRef(0)
  const incorrectClickCountRef = useRef(0)

  const [stage, setStage] = useState(0)
  const increment = () => setStage((s) => s + 1)

  const reset = useCallback(() => {
    correctClickCountRef.current = 0
    incorrectClickCountRef.current = 0
    setStage(0)
  }, [])

  const handleIncorrectClick = useCallback(() => {
    incorrectClickCountRef.current += 1
    if (incorrectClickCountRef.current === 2) {
      return Promise.all([
        card2Ref.current.fail(true),
        card3Ref.current.fail(true),
      ])
        .then(() => card3Ref.current.rotate())
        .then(() => setStage((s) => s + 1))
    }
  }, [])

  const handleCorrectClick = useCallback(() => {
    correctClickCountRef.current += 1
    if (correctClickCountRef.current === 2) {
      return Promise.all([
        card4Ref.current.success(),
        card5Ref.current.success(),
      ]).then(() => setStage((s) => s + 1))
    }
  }, [])

  return (
    <>
      {[0, 1].includes(stage) && (
        <>
          <p>Click a card to flip it over</p>
          <Card ref={card1Ref} onReveal={increment} data-emoji="🙂" />
        </>
      )}
      {[2, 3].includes(stage) && (
        <>
          <p>Incorrect cards flip back</p>
          <Card
            ref={card2Ref}
            onReveal={handleIncorrectClick}
            data-emoji="🙂"
          />
          <Card
            ref={card3Ref}
            onReveal={handleIncorrectClick}
            data-emoji="🙃"
          />
        </>
      )}
      {[4, 5].includes(stage) && (
        <>
          <p>Match cards to win</p>
          <Card ref={card4Ref} onReveal={handleCorrectClick} data-emoji="🙂" />
          <Card
            ref={card5Ref}
            onReveal={handleCorrectClick}
            data-emoji="🙂"
            className={offset}
          />
        </>
      )}
      {[1, 3, 5].includes(stage) && (
        <p>
          <button onClick={increment}>Got it</button>
        </p>
      )}
      {stage === 6 && (
        <>
          <p>You are a master now</p>

          <Card data-emoji="🏆" />

          <p>
            <button onClick={reset}>go again</button>
          </p>
        </>
      )}
    </>
  )
}
