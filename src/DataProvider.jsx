import { createContext, memo } from 'react'

export const DataContext = createContext(null)

export default memo(function DataContextProvider({ tilesets, children }) {
  return <DataContext value={tilesets}>{children}</DataContext>
})
