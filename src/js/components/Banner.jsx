import React from 'react'
import { useSelector } from 'react-redux'

const Ribbon = () => {
  const darkMode = useSelector((state) => state.darkMode)
  const src = darkMode
    ? 'https://github.blog/wp-content/uploads/2008/12/forkme_left_white_ffffff.png?resize=149%2C149'
    : 'https://github.blog/wp-content/uploads/2008/12/forkme_left_darkblue_121621.png?resize=149%2C149'
  return (
    <a href="https://github.com/tswaters/memory">
      <img
        className="attachment-full size-full"
        width="149"
        height="149"
        style={{ position: 'absolute', top: 0, left: 0, border: 0 }}
        src={src}
        alt="Fork me on GitHub"
        data-recalc-dims="1"
      />
    </a>
  )
}

export default Ribbon
