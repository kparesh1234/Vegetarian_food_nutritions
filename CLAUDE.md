# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Indian Food Nutrition Calculator - A web app that analyzes images of Indian food and provides nutrition estimates using Claude's Vision API.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **AI**: Anthropic Claude Vision API

## Commands

```bash
# Install all dependencies (run once after cloning)
npm run install:all

# Run development (both client and server)
npm run dev

# Run only backend (port 3001)
npm run server

# Run only frontend (port 5173)
npm run client
```

## Architecture

```
client/          React frontend with Vite
  src/App.jsx    Main component with image upload
  src/components/NutritionResult.jsx  Results display

server/          Express backend
  index.js       Server entry point
  routes/analyze.js   Claude API integration
```

## Environment Setup

Copy `.env.example` to `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_key_here
```

## API

- `POST /api/analyze` - Accepts `{ image: base64, mimeType: string }`, returns nutrition JSON
- `GET /api/health` - Health check endpoint
