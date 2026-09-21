// so there's a lot of fun we can do here with different backends, etc
// for now keep it simple stupid, just use local storage
// there's a chance this gets corrupted or cheated, that's fine
// opening up to a backend means we need to check the results are valid
// which is kind of a hard problem to solve properly, if it is at all.
// ( impossible to keep a secret from a user on their own machine )
// would require considerable refactors which honestly not interested. this is front-end project.

// using a provider here, as the high scores are going to show up potentially under different trees
// there might be some benefit to keeping most of local storage impl in this provider,
// might get there eventually for now this will be isolated , exposed via specific api for high scores

import * as tilesets from './data/index'
import { difficulties } from './Settings'

import {
  memo,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
} from 'react'

/*

tileset + difficulty + sort by score asc

*/

const HIGH_SCORES_TO_KEEP = 10

const HighScoresContext = createContext({})

const serializeDataStore = (ourMap) => {
  return JSON.stringify(Array.from(ourMap.entries()))
}

const deriveHash = (str) => {
  let hash = 0x811c9dc5 // FNV-1a 32-bit offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    // Multiply by FNV-1a 32-bit prime (0x01000193) using bitwise shift
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  // Convert signed integer to unsigned 32-bit hex string
  return (hash >>> 0).toString(16)

  // const encoder = new TextEncoder()
  // const data = encoder.encode(serialized)
  // const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  // const hashArray = Array.from(new Uint8Array(hashBuffer))
  // return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const serializeKey = ({ difficulty, tileset }) => {
  return ['v1', difficulty, tileset].join('$')
}

const deserializeKey = (str) => {
  const [version, difficulty, tileset] = str.split('$')
  if (version !== 'v1') return
  return { difficulty, tileset }
}

// the design here is to not render much if we can avoid it
// the entrypoint to updating state is the "submit new high score"
// everything aside from that event should be read-only
// this initial deserialize (and serialize in the setter) is the only interface to localStorage
// (we'll also clear out the data structure of long-lost tilesets or difficulties or whatever)
// each entry in the store is an array of {id, name, score, seed}
// they are accessed as a map of ({ tileset, difficulty })
// for serialization, the key is computed into a value
// when deserializing, we destructure the same key & ensure it still matches the schema

// we kind of abuse react in nasty ways to get it to do what we want here
// take advantage of initial setters of state to fire exactly once to bypass a lot of potential compute
// we're going to create our singleton & set it to a ref inside the initial state function, and mutate to our heart's content
// this singleton can emit a string that is going to be more or less unique (hashed) string, that is our state value
// we're going to use that as the `key` attribute for the high scores
// the calculation to get that hash will be pretty heavy i think, so it only should be calculated after user wins
// what should happen is once user enters their score, we'll calculate a new {store}hash, after it gets recorded in local storage, and we'll set the state key.
// it'll re-render because state has changed, it'll see the key has changed, and will dutifully re-render pulling from our updated ref, even if the ref holding our dataset is still the same singleton
// if we're re-rendering high scores repeatedly and this requires reads from the storage , that would be a bug.
// the other tricky bit is react really won't like if we call setters in weird spots.
// might be able to fuck with refs in an initial state render, but i don't think it would work the other way
// they actively advise against reading from refs during render, but we're only *sort of* breaking the rules, so it should still work

export const HighScoresProvider = ({ children }) => {
  const highScoreDataRef = useRef(null)

  const [highScoreState, setHighScoreState] = useState(() => {
    const retVal = new Map()

    let storageValue
    try {
      storageValue = Object.fromEntries(
        JSON.parse(localStorage.getItem('high-scores') ?? '[]'),
      )
    } catch (err) {
      console.error({ err }, 'Failed to parse high scores')
      storageValue = {}
    }

    for (const [key, entry] of Object.entries(storageValue)) {
      const deserialized = deserializeKey(key)
      if (
        !difficulties[deserialized.difficulty] ||
        !tilesets[deserialized.tileset]
      ) {
        continue
      }

      retVal.set(key, entry)
    }

    highScoreDataRef.current = retVal
    return deriveHash(retVal)
  })

  const addNewHighScore = useCallback(
    ({ difficulty, tileset, seed, score, name }) => {
      const data = highScoreDataRef.current
      const key = serializeKey({ difficulty, tileset })

      let newVal = data.get(key)
      if (newVal == null) data.set(key, (newVal = []))

      newVal.push({ seed, score, name, id: Math.random().toString().substr(3) })
      newVal.sort((a, b) => a.score > b.score)

      const serialized = serializeDataStore(data)
      const newHash = deriveHash(serialized)

      localStorage.setItem('high-scores', serialized)
      setHighScoreState(newHash)
    },
    [],
  )

  const qualifiesForNewHighScore = useCallback(
    ({ tileset, difficulty, score }) => {
      if (score === '') return false
      const data = highScoreDataRef.current
      const key = serializeKey({ tileset, difficulty })
      if (!data.get(key)) return true

      let i = 0
      for (const entry of data.get(key)) {
        if (score < entry.score) return true
        if (++i > HIGH_SCORES_TO_KEEP) break
      }

      if (i < HIGH_SCORES_TO_KEEP) return true
      return false
    },
    // eslint-disable-next-line @eslint-react/exhaustive-deps
    [highScoreState],
  )

  const value = useMemo(
    () => ({
      getScores({ tileset, difficulty }) {
        return (
          highScoreDataRef.current.get(serializeKey({ tileset, difficulty })) ??
          []
        )
      },
      addNewHighScore,
      highScoreState,
      qualifiesForNewHighScore,
    }),
    [addNewHighScore, highScoreState, qualifiesForNewHighScore],
  )

  return (
    <HighScoresContext.Provider value={value}>
      {children}
    </HighScoresContext.Provider>
  )
}

export const HighScoresForm = memo(function HighScoresForm({
  difficulty,
  score,
  seed,
  tileset,
  onSubmitNewScore,
}) {
  const ctx = useContext(HighScoresContext)
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    ctx.addNewHighScore({
      difficulty,
      score,
      seed,
      tileset,
      name,
    })
    onSubmitNewScore?.(e)
  }

  if (!ctx.qualifiesForNewHighScore({ tileset, difficulty, score })) {
    return (
      <form method="dialog">
        <button>New Game</button>
      </form>
    )
  }

  return (
    <>
      <p>
        You scored {score} on seed #{seed} and difficulty {difficulty}
      </p>
      <form method="dialog" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" />
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button type="submit">Add new high score</button>
      </form>
    </>
  )
})

export const HighScoresView = memo(({ tileset, difficulty }) => {
  const ctx = useContext(HighScoresContext)

  return (
    <table key={ctx.highScoreState} width="100%" border={1}>
      <caption>
        <p>
          high scores for {tileset} and {difficulty}
        </p>
      </caption>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Score</th>
          <th>Seed</th>
        </tr>
      </thead>
      <tbody>
        {ctx.getScores({ tileset, difficulty }).map((entry, index) => (
          <tr key={entry.id}>
            <td>{index + 1}</td>
            <td>{entry.name}</td>
            <td>{entry.score}</td>
            <td>{entry.seed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
})
