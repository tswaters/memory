import { memo, Fragment } from 'react'

import * as tilesets from './data/index'

export default memo(function Debug() {
  return (
    <>
      <details>
        <summary>Removed Tiles</summary>
        <dl>
          {window.REMOVED_TILES.map((item) => (
            <Fragment key={item.label}>
              <dd>{item.label}</dd>
              <dt>
                {item.emoji} [
                {Array.from(item.emoji)
                  .map(
                    (char) =>
                      `0x${char.codePointAt(0).toString(16).toUpperCase()}`,
                  )
                  .join(',')}
                ]
              </dt>
            </Fragment>
          ))}
        </dl>
      </details>
      <details>
        <summary>All available tiles</summary>
        <dl>
          {Object.entries(tilesets).map(([label, data]) => (
            <Fragment key={label}>
              <dt>
                {label} ({data.length})
              </dt>
              <dd>
                {data.map((item) => (
                  <span key={item.emoji} title={item.label}>
                    {item.emoji}
                  </span>
                ))}
              </dd>
            </Fragment>
          ))}
        </dl>
      </details>
    </>
  )
})
