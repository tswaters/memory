import { memo, useMemo, useEffect, useRef } from 'react'

import { Settings } from './Settings'
import Help from './Help'
import DebugTileDisplay from './DebugTileDisplay'
import TabList from './TabList'

export default memo(function MainMenuDialog({ seed, onSettingChange }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !dialogRef.current.open) {
        dialogRef.current.showModal()
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const dialogEntries = useMemo(
    () => [
      {
        id: 'settings',
        label: 'settings',
        panel: <Settings seed={seed} onSettingChange={onSettingChange} />,
      },
      {
        id: 'help',
        label: 'help',
        panel: <Help />,
      },
      {
        id: 'debug',
        label: 'tile display',
        panel: <DebugTileDisplay />,
      },
    ],
    [seed, onSettingChange],
  )

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
          <TabList entries={dialogEntries} />
        </form>
      </dialog>
    </>
  )
})
