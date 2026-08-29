# Standalone GitHub Pages deployment

This directory is a framework-free static version of the Project Lattice research site.

## Deploy from a branch root

1. Create or open a GitHub repository.
2. Copy everything inside this `github-pages` directory to the repository root.
3. Commit and push the files.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Choose your default branch and `/ (root)`.
7. Save and wait for GitHub Pages to publish the site.

## Deploy with the `gh-pages` branch

Copy this directory’s contents into the root of a `gh-pages` branch, push it, and select that branch as the Pages publishing source.

## Files

- `index.html` — complete standalone page.
- `styles.css` — responsive layout and visual design.
- `.nojekyll` — tells GitHub Pages to serve the directory directly.
- `assets/og.png` — 1200×630 social-sharing image.

For a Markdown/Jekyll alternative, use the ZIP’s `/docs` directory instead.

Official guide: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>
