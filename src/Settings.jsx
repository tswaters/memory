import { memo, use, useState } from 'react'

import { DebouncedRangeInput, MultiSelectOption } from './Forms'
import { DataContext } from './DataProvider'

// this is used as a set-state initializer, working with useLocalStorage, e.g.
//
// const [myValue, ] = useState(() => getFallback('tileset', tilesets))
//
// if settings ever change this will fix broken local storage entries,
// it will reset to first option if whatever saved is no longer available

export const getFallback = (key, options, defaultFn) => {
  const fallback = defaultFn?.() ?? Object.keys(options)[0]
  const settings = JSON.parse(window.localStorage.getItem('settings') ?? '{}')
  const value = settings[key] ?? fallback
  return value === 'unset' ? null : value
}

export default memo(function Settings({ onSettingChange, seed }) {
  const { tilesets, difficulties, themeOptions, reducedMotionOptions } =
    use(DataContext)
  const [settings, setSettings] = useState(() => {
    let storageValue
    try {
      storageValue = JSON.parse(window.localStorage.getItem('settings') ?? '{}')
    } catch (err) {
      console.error({ err }, 'Failed to parse JSON')
      storageValue = {}
    }

    if (storageValue.difficulty == null) {
      storageValue.difficulty = 'easy'
    }

    if (storageValue.theme == null) {
      storageValue.theme = 'unset'
    }

    if (storageValue.tileset == null) {
      storageValue.tileset = 'animals'
    }

    if (storageValue.reduced_motion == null) {
      storageValue.reduced_motion = 'unset'
    }

    return storageValue
  })

  const handleValueUpdate = (e) => {
    let name = e.target.name
    let newValue = e.target.value

    setSettings((prev) => {
      const newSettings = { ...prev, [name]: newValue }
      window.localStorage.setItem('settings', JSON.stringify(newSettings))
      return newSettings
    })
    onSettingChange(name, newValue === 'unset' ? null : newValue)
    e.target.form.submit()
  }

  const { difficulty, tileset, theme, reduced_motion } = settings

  return (
    <form method="dialog">
      <DebouncedRangeInput
        label="Seed"
        id="seed"
        name="seed"
        min={1}
        max={500}
        timeout={500}
        value={seed}
        onChange={handleValueUpdate}
      />

      <hr />

      <MultiSelectOption
        label="Difficulty"
        name="difficulty"
        options={difficulties}
        value={difficulty}
        onChange={handleValueUpdate}
        transpose={true}
      />

      <hr />

      <MultiSelectOption
        label="Theme"
        name="theme"
        options={themeOptions}
        value={theme}
        onChange={handleValueUpdate}
      />

      <hr />

      <MultiSelectOption
        label="Reduced Motion"
        name="reduced_motion"
        options={reducedMotionOptions}
        value={reduced_motion}
        onChange={handleValueUpdate}
      />

      <hr />

      <MultiSelectOption
        label="Tileset"
        name="tileset"
        options={tilesets}
        value={tileset}
        onChange={handleValueUpdate}
      />
    </form>
  )
})
