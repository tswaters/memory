import { memo, useEffect, useRef } from 'react'

export default memo(function MainMenuDialog({ children, finished }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !dialogRef.current.open) {
        dialogRef.current.showModal()
        e.preventDefault()
      }
    }

    if (finished) return // don't do this if the other dialog is open

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [finished])

  return (
    <>
      <button
        onClick={() => dialogRef.current.showModal()}
        aria-label="Settings Menu / New Game / Etc"
        style={{ float: 'right' }}
      >
        ⋮
      </button>
      <dialog ref={dialogRef}>
        Memory {window.APP_VERSION}
        <form method="dialog">
          <button
            aria-label="Close"
            onClick={() => dialogRef.current.close()}
          />
        </form>
        {children}
      </dialog>
    </>
  )
})
