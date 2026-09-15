## set data

I took the emoji-data from here:

https://www.unicode.org/Public/emoji/1.0/emoji-data.txt
https://www.unicode.org/Public/emoji/latest/emoji-test.txt

And manually split it out into various categories (these are located in `./*.txt`)

./convert.js will take these txt files, split by new line, and take whatever is in the "()" as the emoji, everything afterwards is the label.

Everything gets spit out as JSON, which gets required by the application

This runs as a pre-start script, all the JSON files are ignored by default in the editor and version control.

Some of the sets support zero-width joiners to provide for more combinations, these are built-out programatically

Some fun oddities:

- roles have two types, "gender that is skin tone and thing" (people_roles.txt); or "thing that is skin tone and gender" (people_roles2.txt)

- a few of the "thing that is skin tone and gender" doesn't support gender actually, ninja and a few others.

- a few don't support skintone (genie, zombies)

- a few don't support gender OR skintone (troll, hairy monster) (monster is new, doesn't render)
