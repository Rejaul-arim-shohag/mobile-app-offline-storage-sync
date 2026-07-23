# Task Manager App

## Overview
This project is structured as a feature-based React Native application for a task manager assessment. The architecture separates task features, category screens, shared UI, and future cache/state layers.

## Folder Structure
- app/ - app shell and bootstrapping
- features/tasks/ - task list screen, hooks, service, and types
- features/categories/ - category screen
- shared/ - reusable UI components
- src/theme/ - colors and theme tokens

## Setup
1. Install dependencies with pnpm install.
2. Start Metro with pnpm start.
3. Run the app with pnpm android or pnpm ios.

## Backend and storage plan
- Supabase is the intended backend choice for data persistence.
- AsyncStorage or MMKV can be used for local caching; this starter uses a modular storage layer path for future integration.

## State management
A lightweight custom hook and feature-based service layer are used for now. For the full assessment, Zustand or TanStack Query would be a good next step for cache sync and shared state.

## Testing
The project includes a filter/sort hook test to validate the task selection logic.

## Notes
- The current starter focuses on architecture and UI structure for the assessment.
- The next steps are to wire Supabase, add offline cache merge logic, and complete CRUD flows.
