import { createContext, memo, useMemo } from 'react'

export const DataContext = createContext(null)

export default memo(function DataContextProvider({ value: _value, children }) {
  const value = useMemo(() => _value, [_value])
  return <DataContext value={value}>{children}</DataContext>
})
