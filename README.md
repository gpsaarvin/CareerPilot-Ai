# CareerPilot AI

CareerPilot is an AI-powered internship platform focused on real-world internship discovery.

It includes:
- A modern Next.js frontend with Google sign-in flow and light/dark theme support.
- An Express backend for internships, recommendations, resume analysis, and application actions.
- Real provider integrations and AI-assisted company/resume suggestion workflows.

## Project Structure

This repository currently tracks the frontend app (`client`).

Backend code is expected at the sibling path:
- `../server`

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS 4
- Backend (sibling project): Node.js, Express
- Auth: Firebase / Google sign-in flow
- AI: OpenRouter-compatible chat completion integration

## Prerequisites

- Node.js 18+
- npm 9+

## Frontend Setup (this repo)

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env.local` (example values are already scaffolded in the project).

3. Run the frontend:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Backend Setup (sibling folder)

If you have the backend at `../server`:

1. Install dependencies:

```bash
cd ../server
npm install
```

2. Configure `.env` in the backend folder.

3. Run backend:

```bash
npm run dev
```

Default backend URL used by frontend is usually:

```text
http://localhost:5000
```

## Useful Scripts

From this frontend repo:

- `npm run dev` - start frontend in development
- `npm run build` - create production build
- `npm run start` - run production build
- `npm run lint` - run ESLint

From backend sibling project (`../server`):

- `npm run dev` - start backend with watch mode
- `npm run start` - start backend
- `npm run seed` - seed sample data
- `npm run scrape` - run scraper tasks

## Notes

- Brand name: CareerPilot
- If you changed repository remote, run `git remote -v` to verify before pushing.

## License

Private/Internal use unless you define a license file.
