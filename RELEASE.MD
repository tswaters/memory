
```sh

# initial:
git --work-tree "dist" checkout --orphan gh_pages
git --work-tree "dist" add --all
git --work-tree "dist" commit -m "Creating deploy"
git push --quiet origin gh_pages

# incremental
git symbolic-ref HEAD refs/heads/dist
git --work-tree "dist" reset --mixed --quiet
git --work-tree "dist" add --all
git --work-tree "dist" commit -m "Creating deploy"
git push --quiet origin gh_pages

```
