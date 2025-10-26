# Echocity

## How to run locally

1. Install dependencies:

```sh
npm install
```

2. Run the dev server:

```sh
npm run dev
```

3. Open your browser:

- Cover page: `http://localhost:8080/`
- App: `http://localhost:8080/app`

## What technologies are used for this project?

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that will build the app and publish the `dist/` folder to the `gh-pages` branch. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as repository secrets (Settings → Secrets → Actions) before pushing to `main`.

## Deploying to GitHub Pages

You can host the built site on GitHub Pages. This repo includes a GitHub Actions workflow that will:

- Install dependencies
- Inject Vite env vars from repository secrets
- Build the app (output to `dist/`)
- Push `dist/` to the `gh-pages` branch

What you need to do:

1. Add two repository secrets in GitHub: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (Settings → Secrets → Actions). They will be written into `.env.production` during the workflow so Vite can read them.
2. Push to the `main` branch. The workflow `.github/workflows/deploy.yml` will run and deploy the site to the `gh-pages` branch.
3. Enable GitHub Pages for the repository and set the site source to the `gh-pages` branch (Repository Settings → Pages).

Notes:

- The workflow writes env vars to `.env.production` before building, so make sure your Supabase keys are stored as secrets (never commit them to the repo).
- Vite is configured to use a relative base path for production builds so pages work when served from a subpath.
- If you want to use a custom domain, add it in the Pages settings and update DNS per GitHub instructions.

If you'd like, I can also:

- Add a GitHub Action step to run `npm test` or linting before deploy
- Configure the workflow to deploy only on tags (for releases)
- Use an alternate deploy action (e.g., `JamesIves/github-pages-deploy-action`) if you prefer

## Image analysis (Gemini / local stub)

You can integrate a multimodal model (e.g., Gemini 2.5 Pro) to analyze photos users upload and suggest categories like `pothole` or `waste_overflow`.

For local testing there's a small stub server included at `server/analyze_stub.js` that returns mock results. Run it with:

```sh
node server/analyze_stub.js
```

It listens by default on `http://localhost:8787/analyze` and your frontend will POST `{ image_url }` to `/api/analyze` (you can proxy or call the stub URL directly during dev).

To wire the real Gemini/Vertex API, deploy a small serverless function that accepts an image URL, calls the Gemini multimodal endpoint (using a service account or API key kept secret on the server), and returns structured JSON: `{ label, confidence, notes }`.

If you'd like, I can add an example serverless function for Vertex/PaLM that demonstrates sending the image and parsing results (I won't include your keys in the repo). 
