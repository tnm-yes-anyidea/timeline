# British Pathé Chronological Newsreel Archive

A Next.js + Tailwind CSS + Framer Motion web application that sequences British Pathé archival newsreels chronologically by year and intra-year dispatch order.

## Quick Start & Deployment to Vercel

1. **Drop your scraped JSON into the root folder:**
   Place your `british_pathe_by_year.json` file directly in the root of this project (next to `package.json`).

2. **Test Locally:**
   ```bash
   npm install
   npm run dev
   ```
   The `predev` script (`scripts/prepare-data.mjs`) automatically splits `british_pathe_by_year.json` into lightweight static per-year JSON chunks inside `public/data/` so pages load instantaneously.

3. **Push to GitHub & Deploy on Vercel:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: British Pathe archive"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/british-pathe-archive.git
   git push -u origin main
   ```
   Import the GitHub repository on [Vercel](https://vercel.com/new) and click **Deploy**.
