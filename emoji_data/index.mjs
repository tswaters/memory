import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const things = (await fs.readdir(path.join(__dirname, 'data')))
  .filter((thing) => thing.endsWith('.txt') && thing !== 'emoji-test.txt')
  .map((fname) => path.join(__dirname, 'data', fname))

const outputPath = path.join(__dirname, '../src/data')

//
// if looking at add more data into this set, there's a lot between "transport" and "symbols" that haven't been used yet
// most of them are non-complicated, don't use any zwj , it's more a question of classification and grouping than anything else.
//

const data = {} // raw emoji data, flat as needed (simple ones are easy)
const knownLabels = new Map()

const addEntry = (codepoints, label) => {
  const emoji = String.fromCodePoint(...codepoints)
  if (!knownLabels.has(emoji)) knownLabels.set(emoji, label)
  return codepoints
}

for (const _thing of things) {
  const thing = path.basename(_thing, '.txt')

  const lines = await fs.readFile(_thing, 'utf-8')

  data[thing] = Object.fromEntries(
    lines
      .split('\n')
      .filter((x) => !(x === '' || x.startsWith('#')))
      .map((x) => /^(.+?);.*E[0-9.]+ (.+?)$/g.exec(x))
      .filter(Boolean)
      .map(([, str, label]) => [
        str
          .trim()
          .split(' ')
          .map((p) => parseInt(p, 16)),
        label.replace('flag: ', ''),
      ])
      .map(([codepoints, label]) => [label, addEntry(codepoints, label)]),
  )
}

const products = {}

// some of these are really simple

;['faces', 'flags', 'food', 'plants', 'places', 'animals'].forEach((thing) => {
  products[thing] = Object.values(data[thing])
})

// others will require more processing with ZWJ combinations
// unfortunately below lies dragons, it's kind of messy and brittle with legacy handling
// like, someone tell me why cops doesn't use police car modifier?!
//
//
// note, javascript supports using these unicode characters as keys here
// but vscode shows a blank square (weird), so specifying keys in \u{} format

const skintones = {
  0x1f3fb: 'light skin',
  0x1f3fc: 'medium light skin',
  0x1f3fd: 'medium skin',
  0x1f3fe: 'medium dark skin',
  0x1f3ff: 'dark skin',
}

// left is the default i suppose. this only gets uesd in a few cases around sports
// there might be more directionality available in other sets like arrows and the like

// const directions = {
//   '\u{27A1}': 'right',
// }

const manWoman = {
  0x1f9d1: '',
  0x1f468: 'man',
  0x1f469: 'woman',
}

// transgender is listed for completion's sake, in practice it doesn't work anywhere
// cases where it *might* instead use un-qualified gender to mean "person"
// it's actually only used with the trans flag (which is already encoded as part of flags)

const gendersSigns = {
  0x2640: 'woman',
  0x2642: 'man',
  // '\u{26A7}': 'transgender',
}

const doesNotSupportSkintone = [
  'mechanical arm',
  'mechanical leg',
  'brain',
  'anatomical heart',
  'lungs',
  'tooth',
  'bone',
  'eyes',
  'eye',
  'tongue',
  'mouth',
  'biting lip',
]

// these all support skin tone & gender in practice
const supportsDirection = [
  'person walking',
  'person kneeling',
  'white cane',
  'motorized wheelchair',
  'manual wheelchair',
  'person running',
]

// some labels don't make sense when combined, this maps them
const modifierMap = {
  'medical symbol': 'medical worker',
  'graduation cap': 'student',
  school: 'teacher',
  'balance scale': 'judge',
  'sheaf of rice': 'farmer',
  cooking: 'cook',
  wrench: 'mechanic',
  factory: 'factory worker',
  briefcase: 'office worker',
  microscope: 'scientist',
  laptop: 'technologist',
  microphone: 'singer',
  'artist palette': 'artist',
  airplane: 'pilot',
  'ballet shoes': 'ballet dancer',
  rocket: 'astraunaut',
  'fire engine': 'fire fighter',
}

// most of the hand gestures can support multiple skin tones

products.body_parts = Object.entries(data.body_parts).reduce(
  (memo, [label, codes]) => {
    memo.push(codes)

    if (doesNotSupportSkintone.includes(label)) {
      return memo
    }

    Object.entries(skintones).forEach(([skincode, skinlabel]) => {
      memo.push(
        addEntry(codes.concat(0x200d, skincode), `${label} (${skinlabel})`),
      )
    })

    return memo
  },
  [],
)

products.people = []

Object.entries(data.people_skintone).forEach(([label, codes]) => {
  products.people.push(codes)

  Object.entries(skintones).forEach(([code2, label2]) => {
    products.people.push(
      addEntry(codes.concat(0x200d, code2), `${label} (${label2})`),
    )
  })
})

const f = (l, l2) => `${l2} ${l.replace(/person:?\s?/g, '')}`

Object.entries(data.people_skintone_gender).forEach(([label, codes]) => {
  products.people.push(codes)

  if (supportsDirection.includes(label)) {
    products.people.push(
      addEntry(codes.concat(0x200d, 0x27a1, 0xfe0f), `${label} facing right`),
    )
  }

  Object.entries(gendersSigns).forEach(([code2, label2]) => {
    const newCode = codes.concat(0x200d, code2, 0xfe0f)
    const newLabel = f(label, label2)

    products.people.push(addEntry(newCode, newLabel))

    if (supportsDirection.includes(label)) {
      products.people.push(
        addEntry(
          newCode.concat(0x200d, 0x27a1, 0xfe0f),
          `${newLabel} facing right`,
        ),
      )
    }
  })

  Object.entries(skintones).forEach(([code2, label2]) => {
    const newCode = codes.concat(code2)
    const newLabel = `${label} (${label2})`

    products.people.push(addEntry(newCode, newLabel))

    if (supportsDirection.includes(label)) {
      products.people.push(
        addEntry(
          newCode.concat(0x200d, 0x27a1, 0xfe0f),
          `${newLabel} facing right`,
        ),
      )
    }

    Object.entries(gendersSigns).forEach(([code3, label3]) => {
      const newCode = codes.concat(code2, 0x200d, code3, 0xfe0f)
      const newLabel = `${f(label, label3)} (${label2})`

      products.people.push(addEntry(newCode, newLabel))

      if (supportsDirection.includes(label)) {
        products.people.push(
          addEntry(
            newCode.concat(0x200d, 0x27a1, 0xfe0f),
            `${newLabel} facing right`,
          ),
        )
      }
    })
  })
})

Object.entries(data.people_modifiers).forEach(([label, codes]) => {
  label = modifierMap[label] ?? label

  Object.entries(manWoman).forEach(([code2, label2]) => {
    const newCode = [code2, 0x200d, ...codes]
    const newLabel = `${label2} ${label}`
    products.people.push(addEntry([code2, 0x200d, ...codes], newLabel))

    if (supportsDirection.includes(label)) {
      products.people.push(
        addEntry(
          newCode.concat(0x200d, 0x27a1, 0xfe0f),
          `${newLabel} facing right`,
        ),
      )
    }
  })

  Object.entries(skintones).forEach(([code2, label2]) => {
    Object.entries(manWoman).forEach(([code3, label3]) => {
      const newCode = [code3, code2, 0x200d, ...codes]
      const newLabel = `${label3} ${label} (${label2})`

      products.people.push(addEntry(newCode, newLabel))

      if (supportsDirection.includes(label)) {
        products.people.push(
          addEntry(
            newCode.concat(0x200d, 0x27a1, 0xfe0f),
            `${newLabel} facing right`,
          ),
        )
      }
    })
  })
})

Object.entries(data.people_gender).forEach(([label, codes]) => {
  products.people.push(codes)
  Object.entries(gendersSigns).forEach(([gendercode, genderlabel]) => {
    products.people.push(
      addEntry(
        codes.concat(0x200d, gendercode, 0xfe0f),
        `${label} (${genderlabel})`,
      ),
    )
  })
})

Object.values(data.people_others).forEach((codes) => {
  products.people.push(codes)
})

const outputs = {}

Object.entries(products).forEach(([label, arrayOfCodes]) => {
  outputs[label] = arrayOfCodes.map((codepoints) => {
    const emoji = String.fromCodePoint(...codepoints)
    return {
      emoji,
      label: knownLabels.get(emoji),
      // later!
      // codepoints: codepoints
      //   .map((x) => x.toString(16))
      //   .join(',')
      //   .toUpperCase(),
    }
  })
})

// with all the outputs defined, spit out json files & an index file

const exports = []

for (const [thing, newData] of Object.entries(outputs)) {
  exports.push(
    `export {default as ${thing}} from './${path.basename(thing, '.txt')}.json' with { type: 'json' }`,
  )

  await fs.writeFile(
    path.join(outputPath, `${thing}.json`),
    JSON.stringify(newData, null, 4),
  )

  process.stdout.write(`wrote ${path.join(outputPath, `${thing}.json`)}'\n`)
}

process.stdout.write(`wrote ${path.join(outputPath, 'package.json')}'\n`)
await fs.writeFile(
  path.join(outputPath, 'package.json'),
  JSON.stringify({
    name: 'data-dir',
    type: 'module',
    version: '0.0.0',
    sideEffects: false,
  }),
)

process.stdout.write(`wrote ${path.join(outputPath, 'index.mjs')}'\n`)
await fs.writeFile(path.join(outputPath, 'index.mjs'), exports.join('\n'))
