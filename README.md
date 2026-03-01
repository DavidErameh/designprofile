# DesignProfile App: Project Overview

This document provides a comprehensive overview of the `designprofile-app` project based on its structure and source code.

## 🏗️ Technical Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Database & Backend**: [Convex](https://convex.dev/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Styling & UI**: Tailwind CSS v4, Framer Motion, Lucide React, Recharts
- **Payments**: LemonSqueezy
- **AI & Processing**:
  - `@google/generative-ai` (Gemini API for design analysis)
  - `colorthief`, `node-vibrant`, `sharp` (Color and image processing)
  - Custom `playwright-service` (likely for headless browser screenshots/DOM extraction)

## 🗂️ Core Architecture

The application is structured to accept a design (via URL or image upload), process it to extract design tokens (colors, fonts, spacing, layout), and present a unified "Design Profile".

### 1. Database Schema (Convex)

- `analyses`: Stores the status (`pending`, `processing`, `complete`, `error`), source (URL/image), and the final extracted `profile`.
- `urlCache`: Caches URL analyses by `urlHash` to prevent redundant processing.
- `users`: Tracks Clerk users, their chosen plan (`free`, `creator`, `team`), number of analyses, and LemonSqueezy subscription IDs.

### 2. Frontend Application (`src/app`)

- **Home (`/page.tsx`)**: Displays the main landing page with an `<AnalysisInput />` to submit URLs or images.
- **Analysis View (`/analyze/[id]`)**: The core application interface that displays the extracted design profile. It uses a tabbed layout (`PersonaTabs.tsx`):
  - **Brand Tab (`BrandTab.tsx`)**: High-level brand colors, typography, and mood.
  - **Web UI Tab (`WebUITab.tsx`)**: Specific UI components, buttons, and interaction colors.
  - **Developer Tab (`DeveloperTab.tsx`)**: Extracted CSS variables, spacing scales, and ready-to-use code snippets.
  - **Graphic Tab (`GraphicTab.tsx`)**: Image-heavy breakdown.
- **Library (`/library`)**: Likely displays previously saved analyses for the user.

### 3. Analysis Engine (`lib/analysis`)

The heavy lifting occurs in the `lib/analysis` module:

- `gemini.ts`: Interfaces with Google's Gemini to semantically analyze screenshots and extract structure.
- `colors.ts` & `css.ts`: Extracts raw color palettes, dominant colors, and CSS variables.
- `assembler.ts`: Combines the raw outputs from Playwright, Gemini, and image processing into a single, cohesive `profile` object.
- `exports.ts`: Handles exporting the analysis (e.g., to PDF or CSS files).

## 🔄 The User Flow

1. **Input**: User pastes a URL or uploads an image on the home page.
2. **Processing**:
   - A new analysis record is created in Convex.
   - For a URL, the `playwright-service` fetches the page, captures a screenshot, and extracts raw CSS.
   - Image APIs (`sharp`, `node-vibrant`) analyze colors.
   - Gemini interprets the visual structure and typography.
3. **Assembly**: The `assembler.ts` unifies these data points.
4. **Result**: The user is redirected to `/analyze/[id]`, which loads the data from Convex and renders the multi-tabbed interactive report, complete with charts (`DesignDNAChart.tsx`, `ColorRatioPie.tsx`).