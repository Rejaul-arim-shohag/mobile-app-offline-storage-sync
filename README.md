# Task Manager App

A clean, production-grade offline-first React Native Task Manager built with TypeScript, React Navigation, Supabase integration, and a local-first caching system.

---

## 1. Overview & Setup

### Prerequisites

- Node.js >= 22.11.0
- pnpm
- iOS Simulator or Android Emulator

### Setup Steps

1. **Install Dependencies**:

   ```bash
   pnpm install

   ```

2. **Environment Configuration**:
   Create a `.env` file in the root directory (or use `.env.example`):

   ```env
   SUPABASE_URL= https://ucbfmqpjsvdssdzljpdv.supabase.co
   SUPABASE_ANON_KEY= sb_publishable_bn6c_KFfblGF5wPMVZZkYg_HREnFXzl
   ```

3. **Start Metro Bundler**:

   ```bash
   pnpm start
   ```

4. **Run on iOS / Android**:

   ```bash
   pnpm ios
   # or
   pnpm android
   ```

5. **Run Tests**:
   ```bash
   npm test
   ```

---

## 2. Backend & Supabase Schema

### Table Schema (`tasks`)

```sql
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id text not null default 'general',
  status text not null check (status in ('open', 'done')) default 'open',
  due_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null default now()
);
```

### Table Schema (`categories`)

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
```

### Seed Data

```sql
-- Seed Categories
insert into public.categories (id, name, color) values
  ('c1', 'General', '#2563eb'),
  ('c2', 'Work', '#7c3aed'),
  ('c3', 'Personal', '#059669');

-- Seed Tasks
insert into public.tasks (id, title, category_id, status, due_date) values
  ('t1', 'Prepare assessment demo', 'c2', 'open', '2026-07-26'),
  ('t2', 'Review React Native architecture', 'c2', 'open', '2026-07-27'),
  ('t3', 'Setup local offline storage', 'c1', 'done', '2026-07-24'),
  ('t4', 'Buy groceries', 'c3', 'open', '2026-07-25'),
  ('t5', 'Implement background refresh sync', 'c1', 'open', '2026-07-28'),
  ('t6', 'Write unit tests for filter & merge logic', 'c2', 'done', '2026-07-24'),
  ('t7', 'Configure Supabase environment variables', 'c1', 'done', '2026-07-23'),
  ('t8', 'Schedule team sync', 'c3', 'open', '2026-07-29');
```

---

## 3. Architecture & Load-Bearing Decisions

### 3.1 Local Storage Choice & Reasoning

- **Choice**: `@react-native-async-storage/async-storage` paired with a strongly-typed service layer (`taskCache.ts`).
- **Reasoning**: `AsyncStorage` offers maximum stability across both iOS and Android without native binary linking hurdles. Wrapping it inside a modular `taskCache` service allows us to replace the engine (e.g. with `MMKV` or `SQLite`) seamlessly in the future without changing feature code.
- **Offline Read Flow**:
  1. App renders cached tasks immediately on mount.
  2. A background refresh attempts to fetch the latest tasks from Supabase.
  3. If network fails or device is offline, the app continues displaying cached tasks with an offline indicator—never a blank screen or error crash.

### 3.2 State Management Choice & Reasoning

- **Choice**: Custom React Hook (`useTasks`) & feature-based service modularity.
- **Reasoning**: For a focused feature assessment, a clean custom hook encapsulated inside `useTasks` provides an explicit, transparent lifecycle for offline reads, background sync, write-through caching, and sync statuses (`isRefreshing`, `isOffline`, `lastRefreshedAt`). It keeps state predictable without introducing heavy global state boilerplate like Redux Toolkit or TanStack Query.

### 3.3 How `starred` (Local-Only Field) is Preserved Across Refreshes

- **Concept**: `starred` is a per-device user preference that exists strictly in local storage.
- **Merge Logic (`mergeTasksWithCache`)**:
  When a background refresh fetches tasks from Supabase, the application executes `mergeTasksWithCache(remoteTasks, cachedTasks)`:
  ```ts
  export const mergeTasksWithCache = (
    remoteTasks: Task[],
    cachedTasks: Task[],
  ): Task[] => {
    const cachedMap = new Map(cachedTasks.map(t => [t.id, t]));
    return remoteTasks.map(remote => {
      const cached = cachedMap.get(remote.id);
      return {
        ...remote,
        starred:
          cached !== undefined ? cached.starred : remote.starred ?? false,
      };
    });
  };
  ```
  This guarantees that remote updates never wipe out the device's local star flags.

### 3.4 Filtering & Sorting Outside Render Tree

- Filtering by status/category and sorting by due date or created time is performed outside JSX render chains using `useTaskFilters` hook and `filterTasks` utility.
- Search input is debounced by 300ms via `useDebounce` hook before triggering filtering computations.

### 3.5 Offline Creation & Automatic Sync Merge

- **Offline Creation Fallback**: If internet is disconnected when creating a task, `useTasks.createTask` catches the network failure, assigns a temporary local ID (`local_...`), sets `isLocalOnly: true`, and saves the task into local cache immediately.
- **Visual Feedback**: Offline-created tasks display a "Pending Sync" badge in the list view so the user knows the item is saved locally.
- **Automatic Sync Merge**: As soon as connectivity is restored (on pull-to-refresh, manual sync, or app launch), `refreshTasks` iterates over unsynced local tasks, creates them on Supabase, replaces temporary local IDs with server IDs in cache, and merges remote data seamlessly.

---

## 4. Testing Approach

The project includes 3 targeted test suites:

1. `useTaskFilters.test.ts`: Verifies search filtering, status filtering, and sorting by due date outside the render tree.
2. `mergeTasks.test.ts`: Verifies that local-only `starred` flags are preserved when background refreshes return remote data.
3. `taskCache.test.ts`: Verifies reading, writing, and local star toggling against the local storage cache layer.

---

## 5. Known Limitations

- **Offline Writes**: Writes are write-through (must succeed on remote first). Offline write queueing with retry background sync is out of scope per assessment guidelines.
- **Conflict Resolution**: Last write wins on remote updates.

---

## 6. What I Would Do Differently With Another Day

1. **MMKV Integration**: Swap `AsyncStorage` for `react-native-mmkv` for synchronous microsecond read times during cold start.
2. **Offline Mutation Queue**: Implement an offline mutation queue (powered by NetInfo listeners) so tasks created/edited while offline queue up and auto-sync upon reconnection.
3. **Optimistic UI Updates with Rollback**: Immediately update the UI on user actions and roll back state if the remote network request fails.
