import { useCallback, useState, useRef, useMemo, useEffect } from 'react'
import cx from 'classnames'

import { gameState, menu, darkMode, lightMode, game } from './App.css'

import * as tilesets from './data'

import { Settings, difficultyOptions, getFallback } from './Settings'

import { Card } from './Card'
import { game as gameCard } from './Card.css'

import { Help } from './Help'

import TabList from './TabList'
import { DebugTileDisplay } from './DebugTileDisplay'

// minstd_rand
// this is a pseudo-random number generator that needs an initial seed
// not sure how or why it works, but it seems to.
// both range & id need to be deterministic for it to work (because all the tiles are sorted by random id)
const rnd = (s) => {
  const _rnd = () => ((2 ** 31 - 1) & (s = Math.imul(48271, s))) / 2 ** 31
  _rnd() // first call is always junk
  return {
    range(min, max) {
      return Math.floor(_rnd() * max) + min
    },
    id() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/x/g, () => Math.floor(_rnd() * 16).toString(16))
        .replace(/y/g, () => Math.floor(8 + _rnd() * 4).toString(16))
    },
  }
}

function App() {
  const dialogRef = useRef(null)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 500))
  const [score, setScore] = useState(0)

  const tilesRef = useRef(new Map())
  const selectionRef = useRef(null)

  const [difficulty, setDifficulty] = useState(() =>
    getFallback('DIFFICULTY', difficultyOptions),
  )
  const [tileSet, setTileSet] = useState(() => getFallback('TILESET', tilesets))

  const tiles = useMemo(() => {
    const random = rnd(seed)
    const TOTAL_TILES = parseInt(difficultyOptions[difficulty])
    const emojis = new Map()

    while (emojis.size < TOTAL_TILES) {
      const index = random.range(0, tilesets[tileSet].length - 1)
      const entry = tilesets[tileSet][index]
      emojis.set(entry.emoji, entry.label)
    }

    return Array.from(emojis.keys())
      .flatMap((emoji) => [emoji, emoji])
      .map((emoji) => {
        const id = random.id()
        return {
          emoji,
          label: emojis.get(emoji),
          id,
          collate(node) {
            if (node) tilesRef.current.set(id, node)
            else tilesRef.current.delete(id)
          },
        }
      })
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [tileSet, difficulty, seed])

  const handleReveal = useCallback((e) => {
    const id = e.target.id
    const value = e.target.dataset.emoji
    if (selectionRef.current == null) {
      selectionRef.current = { id, value }
    } else if (selectionRef.current.value === value) {
      return Promise.all([
        tilesRef.current.get(id).success(),
        tilesRef.current.get(selectionRef.current.id).success(),
      ]).then((failures) => {
        selectionRef.current = null
        setScore((prev) => failures.reduce((total, item) => total + item, prev))
      })
    } else {
      tilesRef.current.get(id).fail()
      tilesRef.current.get(selectionRef.current.id).fail()
      selectionRef.current = null
    }
  }, [])

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
        panel: (
          <Settings
            seed={seed}
            onSettingChange={(key, value) => {
              if (key === 'theme') {
                document.body.classList.remove(darkMode, lightMode)
                if (value != null) {
                  document.body.classList.add(
                    value === 'DARK' ? darkMode : lightMode,
                  )
                }
                return
              }
              if (key === 'difficulty') setDifficulty(value)
              if (key === 'tileset') setTileSet(value)
              if (key === 'seed') setSeed(value)
              setScore(0)
            }}
          />
        ),
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
    [seed],
  )

  return (
    <>
      <h1>Memory</h1>

      <fieldset className={cx(game, gameCard)}>
        <legend>
          <button
            onClick={() => dialogRef.current.showModal()}
            aria-label="Settings Menu / New Game / Etc"
            style={{ float: 'right' }}
          >
            ⋮
          </button>
          <dl className={gameState}>
            <dt>game id</dt>
            <dd>{seed}</dd>
            <dt>score</dt>
            <dd>{score}</dd>
          </dl>
        </legend>

        {tiles.map(({ id, emoji, label, collate }) => (
          <Card
            key={id}
            id={id}
            data-emoji={emoji}
            data-label={label}
            ref={collate}
            onReveal={handleReveal}
          />
        ))}
      </fieldset>

      <dialog ref={dialogRef} className={menu}>
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
}

export default App
