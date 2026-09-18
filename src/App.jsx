import {
  forwardRef,
  useCallback,
  useState,
  useRef,
  useMemo,
  useImperativeHandle,
  useEffect,
} from 'react'

import cx from 'classnames'

import {
  gameState,
  menu,
  darkMode,
  lightMode,
  card,
  success,
  failure,
  radio,
  vertical,
  game,
  offset,
  formGroup,
} from './App.css'

import * as tilesets from './data'

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

function useLocalStorage(key, options) {
  const [value, setValue] = useState(() => {
    const fallback = Object.keys(options)[0]
    const storageValue = window.localStorage.getItem(key) ?? fallback
    if (options[storageValue] == null) {
      window.localStorage.removeItem(key)
      return fallback
    }
    return storageValue
  })

  const handleUpdateValue = useCallback(
    (e) => {
      let newValue = e.target.value
      if (newValue === 'null') newValue = null
      if (newValue == null) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, newValue)
      }
      setValue(newValue)
      e.target.form.submit()
      return newValue
    },
    [key],
  )

  return [value, handleUpdateValue]
}

const Card = forwardRef(function Card({ onReveal, ...props }, forwardRef) {
  const rotatedRef = useRef(false)
  const flippedRef = useRef(false)

  useImperativeHandle(forwardRef, () => {
    return {
      rotate() {
        return rotateAnimation().finished
      },
      fail(_disable = false) {
        btnRef.current.classList.add(failure)
        return pulseAnimation()
          .finished.then(() => {
            btnRef.current.classList.remove(failure)
            btnRef.current.disabled = _disable
            return flipAnimation(false).finished
          })
          .then(() => {
            const fails = parseInt(btnRef.current.dataset.failures ?? '0')
            btnRef.current.dataset.failures = fails + 1
          })
      },
      success(_disable = true) {
        btnRef.current.classList.add(success)
        btnRef.current.disabled = true
        return pulseAnimation().finished.then(() => {
          btnRef.current.classList.remove(success)
          btnRef.current.disabled = _disable
          return parseInt(btnRef.current.dataset.failures ?? '0')
        })
      },
    }
  })

  const btnRef = useRef(null)

  function pulseAnimation() {
    const animation = btnRef.current.animate(
      [
        { offset: 0.0, transform: 'scale(1)' },
        { offset: 0.5, transform: 'scale(1.1)' },
        { offset: 1.0, transform: 'scale(1)' },
      ],
      { duration: 200, composite: 'add', id: 'pulse' },
    )
    return animation
  }

  function rotateAnimation(shouldRotate = !rotatedRef.current) {
    const spec = !shouldRotate ? '0' : '180'
    rotatedRef.current = !rotatedRef.current

    const animation = btnRef.current.animate(
      { transform: `rotate(${spec}deg)` },
      { duration: 500, composite: 'add', id: 'rotate' },
    )

    btnRef.current.classList.remove(offset)
    animation.finished.then(() => {
      if (flippedRef.current) btnRef.current.classList.add(offset)
      animation.commitStyles()
    })

    return animation
  }

  function flipAnimation(shouldFlip = !flippedRef.current) {
    const prevDisabled = btnRef.current.disabled
    btnRef.current.disabled = true

    const spec = !shouldFlip ? '0' : '180'
    flippedRef.current = !flippedRef.current

    const animation = btnRef.current.animate(
      { transform: `rotateY(${spec}deg)` },
      { duration: 500, id: 'flip' },
    )

    animation.finished.then(() => {
      animation.commitStyles()
      btnRef.current.ariaExpanded = flippedRef.current
      btnRef.current.ariaLabel = flippedRef.current
        ? btnRef.current.dataset.label
        : 'Card'
      btnRef.current.disabled = prevDisabled
    })

    return animation
  }

  const handleClick = useCallback(
    (e) => {
      if (btnRef.current.disabled) return
      e.persist()
      flipAnimation().finished.then(() => {
        btnRef.current.disabled = true
        onReveal?.(e)
      })
    },
    [onReveal],
  )

  return (
    <button
      {...props}
      type="button"
      aria-expanded="false"
      aria-label="Card"
      className={cx(card, props.className ?? '')}
      onClick={handleClick}
      ref={btnRef}
    />
  )
})

function Help() {
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

function MultiSelectOption({
  label,
  options,
  value,
  className = cx(radio, vertical),
  onChange,
}) {
  return (
    <fieldset className={className}>
      <legend>{label}</legend>
      {Object.entries(options).map(([optionKey, optionValue]) => (
        <label key={optionKey}>
          <input
            type="radio"
            value={optionKey}
            checked={optionKey === value}
            onChange={onChange}
          />
          {typeof optionValue === 'string'
            ? optionValue
            : (optionValue?.label ?? optionKey)}
        </label>
      ))}
    </fieldset>
  )
}

function DebouncedRangeInput({
  id,
  label,
  onChange,
  timeout,
  value,
  ...props
}) {
  const timerIdRef = useRef(null)
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    // the guard here is sufficient to ensure duplicate re-renders don't occur
    // 99.999% of the time this function is called, timerIdRef will be set
    // if it's not set, we just came out of the timeout callback finishing
    // this is fine as long as the consumers don't blast value; they won't, it's a debounced input!
    // if we don't keep in state, changes elsewhere in the app won't be reflected (there is new game, etc.)
    // anyway, if the range picker ever breaks with a new version of react, we'll know why :D
    if (timerIdRef.current) return

    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setInternalValue(value)
  }, [value])

  // this has a bug, if the component unmounts before this finishes, react will be unhappy
  const handleChange = useCallback(
    (e) => {
      e.persist()
      setInternalValue(e.target.value)
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current)
      }
      timerIdRef.current = setTimeout(() => {
        timerIdRef.current = null
        onChange(e)
      }, timeout)
    },
    [onChange, timeout],
  )

  return (
    <div className={formGroup}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        onChange={handleChange}
        value={internalValue}
        {...props}
      />
    </div>
  )
}

const difficultyOptions = {
  null: '3',
  medium: '12',
  hard: '30',
}

const themeOptions = {
  null: 'OS Default',
  LIGHT: 'Light',
  DARK: 'Dark',
}

function App() {
  const dialogRef = useRef(null)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 500))
  const [screen, setScreen] = useState(null)
  const [score, setScore] = useState(0)

  const tilesRef = useRef(new Map())
  const selectionRef = useRef(null)

  const [difficulty, handleDifficultyChange] = useLocalStorage(
    'DIFFICULTY',
    difficultyOptions,
  )

  const [tileSet, handleTilesetUpdate] = useLocalStorage('TILESET', tilesets)
  const [theme, handleThemeChange] = useLocalStorage('THEME', themeOptions)

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
      .map((emoji) => ({
        emoji,
        label: emojis.get(emoji),
        id: random.id(),
      }))
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
        const scoreChange = failures.reduce((total, item) => total + item, 0)
        setScore((prev) => prev + scoreChange)
      })
    } else {
      tilesRef.current.get(id).fail()
      tilesRef.current.get(selectionRef.current.id).fail()
      selectionRef.current = null
    }
  }, [])

  useEffect(() => {
    function handleClose() {
      setScreen(null)
    }

    const currentRef = dialogRef.current
    if (currentRef == null) return

    currentRef.addEventListener('close', handleClose)
    return () => currentRef.removeEventListener('close', handleClose)
  })

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

  const handleScreen = useCallback((e) => {
    setScreen(e.target.value)
  }, [])

  return (
    <>
      <h1>Memory</h1>

      <fieldset className={game}>
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

        {tiles.map(({ id, emoji, label }) => (
          <Card
            key={id}
            id={id}
            data-emoji={emoji}
            data-label={label}
            ref={(node) => {
              if (node) tilesRef.current.set(id, node)
              else tilesRef.current.delete(id)
            }}
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
        </form>
        <menu>
          <label>
            <input
              type="radio"
              onChange={handleScreen}
              value="settings"
              checked={screen === 'settings'}
              aria-selected={screen === 'help'}
            />
            settings
          </label>
          <label>
            <input
              type="radio"
              onChange={handleScreen}
              value="help"
              checked={screen === 'help'}
              aria-selected={screen === 'help'}
            />
            show help
          </label>
        </menu>
        {screen === 'won' && (
          <>
            <h2>You won!</h2>
            <button onClick={() => setSeed(Math.floor(Math.random() * 500))}>
              New Game
            </button>
          </>
        )}
        {screen === 'settings' && (
          <div role="tabpanel">
            <hr />

            <DebouncedRangeInput
              label="Seed"
              id="seed"
              min={1}
              max={500}
              timeout={500}
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value))}
            />

            <hr />

            <MultiSelectOption
              label="Number of Matches"
              options={difficultyOptions}
              value={difficulty}
              onChange={handleDifficultyChange}
            />

            <hr />

            <MultiSelectOption
              label="Theme"
              options={themeOptions}
              value={theme}

              onChange={(e) => {
                const newValue = handleThemeChange(e)
                document.body.classList.remove(darkMode, lightMode)
                if (newValue !== 'null') {
                  document.body.classList.add(
                    newValue === 'DARK' ? darkMode : lightMode,
                  )
                }
              }}
            />

            <hr />

            <MultiSelectOption
              storageKey="TILESET"
              label="Tileset"
              options={tilesets}
              value={tileSet}
              onChange={handleTilesetUpdate}
            />
          </div>
        )}
        {screen === 'help' && <Help />}
      </dialog>
    </>
  )
}

export default App
