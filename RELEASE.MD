```sh

#always
npm run build

# initial:
git --work-tree "dist" checkout --orphan gh-pages
git --work-tree "dist" add --all
git --work-tree "dist" commit -m "Creating deploy"
git push --quiet origin gh-pages

# incremental
git symbolic-ref HEAD refs/heads/gh-pages
git --work-tree "dist" reset --mixed --quiet
git --work-tree "dist" add --all
git --work-tree "dist" commit -m "Latest changes"
git push --quiet origin gh-pages

# go back
git symbolic-ref HEAD refs/heads/master
git reset --mixed

```
