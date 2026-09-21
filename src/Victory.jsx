import { memo, useEffect, useRef } from 'react'

import { HighScoresForm, HighScoresView } from './HighScores'

export default memo(function Victory({
  onClose,
  tileset,
  seed,
  score,
  difficulty,
  finished,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const myDialog = dialogRef.current
    if (!myDialog) return

    const handleClose = (e) => onClose?.(e)
    myDialog.addEventListener('close', handleClose)
    return () => myDialog.removeEventListener('close', handleClose)
  }, [onClose])

  useEffect(() => {
    if (!finished) return

    const myDialog = dialogRef.current
    if (!myDialog) return

    myDialog.showModal()
    return () => {
      myDialog.closeModal?.()
    }
  }, [finished])

  return (
    <dialog ref={dialogRef}>
      <button aria-label="Close" onClick={() => dialogRef.current.close()} />
      <h2>You win!</h2>
      <hr />

      <HighScoresForm
        seed={seed}
        tileset={tileset}
        difficulty={difficulty}
        score={score}
      />

      <p>
        You scored {score} on seed #{seed} and difficulty {difficulty}
      </p>
      <h3>High Scores</h3>
      <HighScoresView tileset={tileset} difficulty={difficulty} />
    </dialog>
  )
})
