## set data

I took the emoji-data from here:

https://www.unicode.org/Public/emoji/1.0/emoji-data.txt
https://www.unicode.org/Public/emoji/latest/emoji-test.txt

And manually split it out into various categories (these are located in `./*.txt`)

./convert.js will take these txt files, split by new line, and take whatever is in the "()" as the emoji, everything afterwards is the label.

Everything gets spit out as JSON, which gets required by the application

This runs as a pre-start script, all the JSON files are ignored by default in the editor and version control.

Some of the sets support zero-width joiners to provide for more combinations, these are built-out programatically

Based on the name of the file, each of the types of joiners will be enumerated (manwoman/skintone)

There's also "modifiers" which gets added to the end of manwoman/skintone combos to get different characters (e.g., 🌾 = farmer)
