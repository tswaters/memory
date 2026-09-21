import { useRef, useState, useEffect, useCallback } from 'react'

import { radio, vertical, formGroup } from './Forms.css'
import cx from 'classnames'

export function MultiSelectOption({
  name,
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
            name={name}
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

export function DebouncedRangeInput({
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
