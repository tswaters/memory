import { createContext, memo } from 'react'

export const DataContext = createContext(null)

export default memo(function DataContextProvider({ tilesets, children }) {
  return (
    <DataContext.Provider value={tilesets}>{children}</DataContext.Provider>
  )
})
