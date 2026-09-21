import { memo, useState, useCallback } from 'react'

import * as tilesets from './data/index'

import { DebouncedRangeInput, MultiSelectOption } from './Forms'

export const difficultyOptions = {
  null: '3',
  medium: '12',
  hard: '30',
}

export const themeOptions = {
  null: 'OS Default',
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
  const storageValue = window.localStorage.getItem(key) ?? fallback
  if (options[storageValue] == null) {
    window.localStorage.removeItem(key)
    return fallback
  }
  return storageValue
}

export function useLocalStorage(key, options) {
  const [value, setValue] = useState(() => getFallback(key, options))

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

export const Settings = memo(function Settings({ onSettingChange, seed }) {
  const [difficulty, handleDifficultyChange] = useLocalStorage(
    'DIFFICULTY',
    difficultyOptions,
  )

  const [tileSet, handleTilesetUpdate] = useLocalStorage('TILESET', tilesets)
  const [theme, handleThemeChange] = useLocalStorage('THEME', themeOptions)

  return (
    <>
      <DebouncedRangeInput
        label="Seed"
        id="seed"
        min={1}
        max={500}
        timeout={500}
        value={seed}
        onChange={(e) => onSettingChange('seed', parseInt(e.target.value))}
      />

      <hr />

      <MultiSelectOption
        label="Number of Matches"
        options={difficultyOptions}
        value={difficulty}
        onChange={(e) => {
          const newValue = handleDifficultyChange(e)
          onSettingChange('difficulty', newValue)
        }}
      />

      <hr />

      <MultiSelectOption
        label="Theme"
        options={themeOptions}
        value={theme}
        onChange={(e) => {
          const newValue = handleThemeChange(e)
          onSettingChange('theme', newValue)
        }}
      />

      <hr />

      <MultiSelectOption
        storageKey="TILESET"
        label="Tileset"
        options={tilesets}
        value={tileSet}
        onChange={(e) => {
          const newValue = handleTilesetUpdate(e)
          onSettingChange('tileset', newValue)
        }}
      />
    </>
  )
})
