# IELTS Score Tracker

A private, local-first dashboard for recording IELTS writing attempts, Task 1 / Task 2, mistakes, and progress. Results live only in your browser's localStorage — there is no account, backend, or cloud sync.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Features

- IELTS section scores with an automatically calculated, half-band-rounded overall score
- Numbered writing attempts, Task 1 / Task 2 tagging, and mistakes/improvement notes
- Editable history sorted by writing attempt number and a responsive Recharts progress chart
