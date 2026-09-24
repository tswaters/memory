import { memo, useImperativeHandle, useEffect, useRef, forwardRef } from 'react'

export default memo(
  forwardRef(function Dialog({ children, onClose }, forwardRef) {
    const dialogRef = useRef(null)

    useImperativeHandle(forwardRef, () => ({
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
          <button
            aria-label="Close"
            onClick={() => dialogRef.current.close()}
          />
        </form>
        {children}
      </dialog>
    )
  }),
)
