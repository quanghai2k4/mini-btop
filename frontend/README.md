# mini-btop Frontend

Modern React + TypeScript + Shadcn UI dashboard for mini-btop system monitor.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Lucide React** - Icons

## Development

### Prerequisites

Make sure you're in the Nix development environment:

```bash
nix develop --impure
```

### Install Dependencies

```bash
cd frontend
npm install
```

### Development Mode

Run frontend dev server (with hot reload):

```bash
npm run dev
```

The Go backend must be running separately on port 8080 for the API proxy to work.

### Build for Production

```bash
npm run build
```

This will build the app to `../static/` directory, which the Go server will serve.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # Shadcn UI components
│   │   ├── Header.tsx    # App header with theme toggle
│   │   ├── StatCard.tsx  # Stat cards (CPU, Memory, etc)
│   │   ├── SystemStatus.tsx
│   │   └── Recommendations.tsx
│   ├── hooks/
│   │   └── useSystemMetrics.ts  # SSE connection hook
│   ├── lib/
│   │   └── utils.ts      # Utility functions
│   ├── types/
│   │   └── metrics.ts    # TypeScript types
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Features

- ✅ Real-time system metrics via SSE
- ✅ Light/Dark theme toggle
- ✅ Responsive design
- ✅ Type-safe TypeScript
- ✅ Modern component library (Shadcn UI)
- ✅ Smart recommendations based on system usage
- ✅ CPU per-core monitoring
- ✅ Network spike detection
