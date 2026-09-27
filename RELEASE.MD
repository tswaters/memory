```sh

git checkout --orphan gh-pages
git worktree add dist gh-pages

npm version -m "Release v0.0.0"
npm run build # uses package.json for version
git push --tags # npm version creates a tag

cd dist
git add --all
git commit -m "Release v0.0.0"
git push origin gh-pages

```
