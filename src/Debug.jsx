import { memo, use } from 'react'
import { DataContext } from './DataProvider'

function PrintEmoji({ item: { emoji, label } }) {
  return (
    <figure>
      <span>{emoji}</span>
      <figcaption>
        {label} [
        {Array.from(emoji)
          .map((char) => `0x${char.codePointAt(0).toString(16).toLowerCase()}`)
          .join(', ')}
        ]
      </figcaption>
    </figure>
  )
}

const tileGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
}

export default memo(function Debug() {
  const { tilesets } = use(DataContext)
  return (
    <>
      <details>
        <summary>Removed Tiles</summary>
        <div style={tileGrid}>
          {window.REMOVED_TILES.map((item) => (
            <PrintEmoji key={item.emoji} item={item} />
          ))}
        </div>
      </details>
      {Object.entries(tilesets).map(([label, data]) => (
        <details key={label}>
          <summary>
            {label} ({data.length})
          </summary>
          <div style={tileGrid}>
            {data.map((item) => (
              <PrintEmoji key={item.emoji} item={item} />
            ))}
          </div>
        </details>
      ))}
    </>
  )
})
