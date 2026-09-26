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

for (const _thing of things) {
  const thing = path.basename(_thing, '.txt')

  const allLines = await fs.readFile(_thing, 'utf-8')

  const lines = allLines
    .split('\n')
    .filter((x) => !(x === '' || x.startsWith('#')))

  const matches = lines
    .map((x) => /^(.+?);.*# (.+?) E[0-9.]+ (.+?)$/g.exec(x))
    .filter(Boolean)
    .map(([, arraystr, emoji, label]) => {
      return {
        // codepoints: arraystr.trim().split(' '), // for later
        emoji,
        label: label.replace('flag: ', ''),
      }
    })

  data[thing] = matches
}

const outputs = {}

// some of these are really simple

;['faces', 'flags', 'food', 'plants', 'places', 'animals'].forEach((thing) => {
  outputs[thing] = data[thing]
})

// others will require more processing with ZWJ combinations
// unfortunately below lies dragons, it's kind of messy and brittle with legacy handling
// like, someone tell me why cops doesn't use police car modifier?!
//
//
// note, javascript supports using these unicode characters as keys here
// but vscode shows a blank square (weird), so specifying keys in \u{} format

const skintones = {
  '\u{1F3FB}': 'light skin',
  '\u{1F3FC}': 'medium light skin',
  '\u{1F3FD}': 'medium skin',
  '\u{1F3FE}': 'medium dark skin',
  '\u{1F3FF}': 'dark skin',
}

// left is the default i suppose. this only gets uesd in a few cases around sports
// there might be more directionality available in other sets like arrows and the like

// const directions = {
//   '\u{27A1}': 'right',
// }

const manWoman = {
  '\u{1F468}': 'man',
  '\u{1F469}': 'woman',
  '\u{1F9D1}': 'person',
}

// transgender is listed for completion's sake, in practice it doesn't work anywhere
// cases where it *might* instead use un-qualified gender to mean "person"
// it's actually only used with the trans flag (which is already encoded as part of flags)

const gendersSigns = {
  '\u{2640}': 'woman',
  '\u{2642}': 'man',
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

// most of the hand gestures can support multiple skin tones

outputs.body_parts = data.body_parts.reduce((memo, entry) => {
  if (doesNotSupportSkintone.includes(entry.label)) {
    memo.push(entry)
  } else {
    Object.entries(skintones).forEach(([skincode, skinlabel]) => {
      memo.push({
        emoji: `${entry.emoji}\u200D${skincode}`,
        label: `${entry.label} ${skinlabel}`,
      })
    })
  }
  return memo
}, [])

outputs.people = []

outputs.people.push(
  ...data.people_skintone.flatMap((entry) =>
    Object.entries(skintones).map(([skincode, skinlabel]) => ({
      emoji: `${entry.emoji}\u200D${skincode}`,
      label: `${entry.label} (${skinlabel})`,
    })),
  ),
)

outputs.people.push(
  ...data.people_skintone_gender.reduce((memo, entry) => {
    Object.entries(skintones).forEach(([skincode, skinlabel]) => {
      memo.push({
        emoji: `${entry.emoji}${skincode}`,
        label: `${entry.label} ${skinlabel})`,
      })
      Object.entries(gendersSigns).forEach(([gendercode, genderlabel]) => {
        memo.push({
          emoji: `${entry.emoji}${skincode}\u200D${gendercode}`,
          label: `${entry.label} ${genderlabel} (${skinlabel})`,
        })

        // in practice there is only 1 direction supported for these joiners
        if (supportsDirection.includes(entry.label)) {
          memo.push({
            emoji: `${entry.emoji}${skincode}\u200D${gendercode}\u200D\u27A1`,
            label: `${entry.label} ${genderlabel} facing right (${skinlabel})`,
          })
        }
      })
    })
    return memo
  }, []),
)

outputs.people.push(
  ...data.people_modifiers.reduce((memo, entry) => {
    Object.entries(skintones).forEach(([skincode, skinlabel]) => {
      Object.entries(manWoman).forEach(([gendercode, genderlabel]) => {
        memo.push({
          emoji: `${gendercode}\u200D${skincode}\u200D${entry.emoji}`,
          label: `${genderlabel} ${skinlabel} (${entry.label})`,
        })
      })
    })
    return memo
  }, []),
)

outputs.people.push(
  ...data.people_gender.flatMap((entry) =>
    Object.entries(gendersSigns).map(([gendercode, genderlabel]) => ({
      emoji: `${entry.emoji}\u200D${gendercode}`,
      label: `${entry.label} (${genderlabel})`,
    })),
  ),
)

outputs.people.push(...data.people_others)

// with all the outputs defined, spit out json files & an index file

const exports = []

for (const [thing, newData] of Object.entries(outputs)) {
  exports.push(
    `export {default as ${thing}} from './${path.basename(thing, '.txt')}'`,
  )

  // ones last sweep, apply fe0f to everything
  newData.forEach((x) => (x.emoji = `${x.emoji}\u{fe0f}`))

  await fs.writeFile(
    path.join(outputPath, `${thing}.json`),
    JSON.stringify(newData, null, 4),
  )

  process.stdout.write(`wrote ${path.join(outputPath, `${thing}.json`)}'\n`)
}

process.stdout.write(`wrote ${path.join(outputPath, 'index.js')}'\n`)
await fs.writeFile(path.join(outputPath, 'index.js'), exports.join('\n'))
