import { memo, use, useState, useSyncExternalStore } from 'react'

import { form } from './HighScores.css'
import { formGroup } from './Forms.css'
import { rainbow } from './index.css'

import {
  fetchQualifies,
  clearQualifies,
  highScoreStoreCache,
} from './HighScores.mjs'

const dtf = new Intl.DateTimeFormat('en-CA', {
  timeStyle: 'short',
  dateStyle: 'short',
})

export const HighScoresForm = memo(function HighScoresForm({
  difficulty,
  score,
  seed,
  tileset,
  onSubmitNewScore,
}) {
  const store = highScoreStoreCache(tileset, difficulty)
  const [name, setName] = useState('')

  const qualifies = use(fetchQualifies({ difficulty, tileset, score }))

  async function addScoreAction(formData) {
    formData.append('when', null)
    formData.append('seed', seed)
    formData.append('difficulty', difficulty)
    formData.append('tileset', tileset)
    formData.append('score', score)

    await store.postNewScore(
      Object.fromEntries(
        Array.from(formData.entries()).map(([name, value]) => {
          if (['score', 'seed'].includes(name)) value = parseInt(value, 10)
          if (name === 'when') value = new Date()
          return [name, value]
        }),
      ),
    )

    clearQualifies()
    onSubmitNewScore?.()
  }

  if (!qualifies) {
    return (
      <form method="dialog" className={form}>
        <button>New Game</button>
      </form>
    )
  }

  return (
    <form className={form} action={addScoreAction}>
      <div className={formGroup}>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button
        type="submit"
        aria-label="Add New Score"
        style={{ border: 'none' }}
      >
        ☑️
      </button>
    </form>
  )
})

export const HighScoresView = memo(function HighScoresView({
  seed,
  tileset,
  difficulty,
}) {
  const store = highScoreStoreCache(tileset, difficulty)
  const scores = useSyncExternalStore(store.subscribe, store.getSnapshot)
  return (
    <table width="100%" border={1}>
      <caption style={{ captionSide: 'bottom' }}>
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
          <th>when</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((entry, index) => (
          <tr key={entry.id} className={entry.seed === seed ? rainbow : ''}>
            <td>{index + 1}</td>
            <td>{entry.name}</td>
            <td>{entry.score}</td>
            <td>{entry.seed}</td>
            <td>{dtf.format(entry.when)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
})
