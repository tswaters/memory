import { useCallback, useState, useRef, useMemo } from 'react'
import cx from 'classnames'

import { darkMode, lightMode } from './index.css'
import { gameState, game } from './App.css'
import { game as gameCard } from './Card.css'

import * as tilesets from './data'

import { difficultyOptions, getFallback } from './Settings'

import Card from './Card'
import MainMenuDialog from './MainMenuDialog'

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

  const onSettingChange = useCallback((key, value) => {
    if (key === 'theme') {
      document.body.classList.remove(darkMode, lightMode)
      if (value != null) {
        document.body.classList.add(value === 'DARK' ? darkMode : lightMode)
      }
      return
    }
    if (key === 'difficulty') setDifficulty(value)
    if (key === 'tileset') setTileSet(value)
    if (key === 'seed') setSeed(value)
    setScore(0)
  }, [])

  return (
    <>
      <h1>Memory</h1>

      <fieldset className={cx(game, gameCard)}>
        <legend>
          <MainMenuDialog onSettingChange={onSettingChange} seed={seed} />
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
    </>
  )
}

export default App
