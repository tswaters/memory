import { memo, useImperativeHandle, useEffect, useRef } from 'react'

export default memo(function Dialog({ children, ref, onClose }) {
  const dialogRef = useRef(null)

  useImperativeHandle(ref, () => ({
    showModal() {
      dialogRef.current.showModal()
    },
    close() {
      dialogRef.current.close()
    },
    get open() {
      return dialogRef.current.open
    },
  }))

  useEffect(() => {
    const myDialog = dialogRef.current
    if (!myDialog) return

    const handleClose = (e) => onClose?.(e)
    myDialog.addEventListener('close', handleClose)
    return () => myDialog.removeEventListener('close', handleClose)
  }, [onClose])

  return (
    <dialog ref={dialogRef}>
      <form method="dialog">
        <button aria-label="Close" onClick={() => dialogRef.current.close()} />
      </form>
      {children}
    </dialog>
  )
})
