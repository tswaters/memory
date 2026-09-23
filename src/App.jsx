import { useCallback, useState, useRef, useMemo } from 'react'
import cx from 'classnames'

import { darkMode, lightMode } from './index.css'
import { gameState, game } from './App.css'
import { game as gameCard } from './Card.css'

import * as tilesets from './data'

import { default as Settings, difficulties, getFallback } from './Settings'

import Help from './Help'
import DebugTileDisplay from './DebugTileDisplay'
import TabList from './TabList'
import { HighScoresForm, HighScoresView } from './HighScores'

import Card from './Card'
import MainMenuDialog from './MainMenuDialog'
import Victory from './Victory'

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
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 500))
  const [score, setScore] = useState('')
  const [finished, setFinished] = useState(false)
  const flippedCountRef = useRef(0)

  const tilesRef = useRef(new Map())
  const selectionRef = useRef(null)

  const [difficulty, setDifficulty] = useState(() =>
    getFallback('difficulty', difficulties),
  )
  const [tileset, setTileset] = useState(() => getFallback('tileset', tilesets))

  const reset = useCallback((reseed = false) => {
    flippedCountRef.current = 0
    if (reseed) setSeed(Math.floor(Math.random() * 500))
    setFinished(false)
    setScore('')
  }, [])

  const tiles = useMemo(() => {
    const random = rnd(seed)
    const TOTAL_TILES = parseInt(difficulties[difficulty])
    const emojis = new Map()

    while (emojis.size < TOTAL_TILES) {
      const index = random.range(0, tilesets[tileset].length - 1)
      const entry = tilesets[tileset][index]
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
  }, [tileset, difficulty, seed])

  const handleReveal = useCallback(
    (e) => {
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
          setScore((prev) =>
            failures.reduce(
              (total, item) => total + item,
              prev === '' ? 0 : prev,
            ),
          )
          setFinished(() => tiles.length / 2 === ++flippedCountRef.current)
        })
      } else {
        tilesRef.current.get(id).fail()
        tilesRef.current.get(selectionRef.current.id).fail()
        selectionRef.current = null
      }
    },
    [tiles.length],
  )

  const onSettingChange = useCallback(
    (key, value) => {
      if (key === 'theme') {
        document.body.classList.remove(darkMode, lightMode)
        if (value != null) {
          document.body.classList.add(value === 'DARK' ? darkMode : lightMode)
        }
        return
      }
      if (key === 'difficulty') setDifficulty(value)
      if (key === 'tileset') setTileset(value)
      if (key === 'seed') setSeed(value)
      reset(false)
    },
    [reset],
  )

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
      {
        id: 'high-scores',
        label: 'high scores',
        panel: <HighScoresView difficulty={difficulty} tileset={tileset} />,
      },
    ],
    [seed, onSettingChange, tileset, difficulty],
  )

  return (
    <>
      <h1>Memory</h1>

      <fieldset className={cx(game, gameCard)}>
        <legend>
          <MainMenuDialog finished={finished}>
            <TabList entries={dialogEntries} />
          </MainMenuDialog>
          <dl className={gameState}>
            <dt>game id</dt>
            <dd>{seed}</dd>
            {score !== '' && (
              <>
                <dt>score</dt>
                <dd>{score}</dd>
              </>
            )}
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

      <Victory onClose={reset} finished={finished}>
        <h2>You win!</h2>
        <hr />
        <HighScoresForm
          seed={seed}
          tileset={tileset}
          difficulty={difficulty}
          score={score}
          onSubmitNewScore={() => setScore('')}
        />
        <HighScoresView tileset={tileset} difficulty={difficulty} seed={seed} />
      </Victory>
    </>
  )
}

export default App
