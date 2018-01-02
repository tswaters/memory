
## set data

I took the emoji-data from here:  http://www.unicode.org/Public/emoji/1.0/emoji-data.txt

And manually split it out into various categories (these are located in `./*.txt`)

./convert.js will take these txt files, split by new line, and take the first column and convert the whole thing into a json array, with each unicode point being converted into it's surrogate pair. (`./*.json`)

