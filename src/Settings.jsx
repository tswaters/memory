import { memo, useState } from 'react'

import * as tilesets from './data/index'

import { DebouncedRangeInput, MultiSelectOption } from './Forms'

export const difficulties = {
  easy: '3',
  medium: '12',
  hard: '30',
}

export const themeOptions = {
  unset: 'OS Default',
  LIGHT: 'Light',
  DARK: 'Dark',
}

// this is used as a set-state initializer, working with useLocalStorage, e.g.
//
// const [myValue, ] = useState(() => getFallback('tileset', tilesets))
//
// if settings ever change this will fix broken local storage entries,
// it will reset to first option if whatever saved is no longer available

export const getFallback = (key, options) => {
  const fallback = Object.keys(options)[0]
  const settings = JSON.parse(window.localStorage.getItem('settings') ?? '{}')
  return settings[key] ?? fallback
}

export default memo(function Settings({ onSettingChange, seed }) {
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
    onSettingChange(name, newValue)
    e.target.form.submit()
  }

  const { difficulty, tileset, theme } = settings

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
        label="Number of Matches"
        name="difficulty"
        options={difficulties}
        value={difficulty}
        onChange={handleValueUpdate}
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
        label="Tileset"
        name="tileset"
        options={tilesets}
        value={tileset}
        onChange={handleValueUpdate}
      />
    </form>
  )
})
