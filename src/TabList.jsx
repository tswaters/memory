import { memo, useRef, useCallback } from 'react'

import { tabList } from './TabList.css'

/*
<Tabs entries={[
    {
        id: 'panel1',
        label: 'panel1',
        panel: <Panel1 />,
    },
    {
        id: 'panel2',
        label: 'panel2',
        panel: <Panel2 />,
    },
]} />
*/

function Tabs({ entries }) {
  const tabsRef = useRef(new Map())
  const panelsRef = useRef(new Map())

  const handleClick = useCallback((e) => {
    const id = e.target.id
    const panelId = e.target.getAttribute('aria-controls')

    // mark all buttons as non-selected except the clicked one
    tabsRef.current.values().forEach((tab) => {
      tab.setAttribute('aria-selected', tab.id === id)
      tab.tabIndex = tab.id === id ? 0 : -1
    })

    panelsRef.current.values().forEach((panel) => {
      panel.hidden = panel.id !== panelId
    })
  }, [])

  // this handles left-right arrow keyboard navigation
  // focused tab will be e.target
  const handleKeyDown = useCallback((e) => {
    const id = e.target.id

    // just make sure we're not dealing with shit, unmounting and the like
    const tab = tabsRef.current.get(id)
    if (tab == null) return

    let newId
    switch (e.key) {
      case 'Home':
        newId = tab.parentNode.firstChild.id
        break
      case 'End':
        newId = tab.parentNode.lastChild.id
        break
      case 'ArrowLeft':
        newId = tab.nextSibling.id ?? tab.parentNode.lastChild.id
        break
      case 'ArrowRight':
        newId = tab.previousSibling.id ?? tab.parentNode.firstChild.id
        break
      default:
        return
    }

    e.preventDefault()
    e.stopPropogation()
    tabsRef.current.get(newId).focus()
  }, [])

  return (
    <div className={tabList}>
      <div role="tablist" onKeyDown={handleKeyDown}>
        {entries.map((entry, index) => (
          <button
            key={entry.id}
            id={`tab-${entry.id}`}
            ref={(node) => {
              if (node) tabsRef.current.set(entry.id, node)
              else tabsRef.current.delete(entry.id)
            }}
            role="tab"
            aria-controls={`panel-${entry.id}`}
            aria-selected={index === 0}
            tabIndex={index === 0 ? 0 : -1}
            onClick={handleClick}
          >
            {entry.label}
          </button>
        ))}
      </div>
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          id={`panel-${entry.id}`}
          ref={(node) => {
            if (node) panelsRef.current.set(entry.id, node)
            else panelsRef.current.delete(entry.id)
          }}
          role="tabpanel"
          aria-labelledby={`tab-${entry.id}`}
          tabIndex={0}
          hidden={index !== 0}
        >
          {entry.panel}
        </div>
      ))}
    </div>
  )
}

export default memo(Tabs)
