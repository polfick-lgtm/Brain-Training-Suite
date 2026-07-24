import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { GamesPage } from '../pages/GamesPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProfilePage } from '../pages/ProfilePage'
import { SessionsPage } from '../pages/SessionsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { HanoiPage } from '../games/hanoi/HanoiPage'
import { TowerOfLondonPage } from '../games/tower-of-london/TowerOfLondonPage'
import {
  DigitSpanPage,
  MemoryPage,
  SimonPage,
  VisualMemoryPage,
} from '../games/memory-suite/MemorySuitePages'
import {
  NBackPage,
  ReactionPage,
  StroopPage,
  TrailMakingPage,
} from '../games/attention-suite/AttentionSuitePages'

const ProgressPage = lazy(() =>
  import('../pages/ProgressPage').then((module) => ({
    default: module.ProgressPage,
  })),
)

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/giochi" element={<GamesPage />} />
        <Route path="/sessioni" element={<SessionsPage />} />
        <Route
          path="/progressi"
          element={
            <Suspense fallback={<p role="status">Caricamento progressi…</p>}>
              <ProgressPage />
            </Suspense>
          }
        />
        <Route path="/profilo" element={<ProfilePage />} />
        <Route path="/impostazioni" element={<SettingsPage />} />
        <Route path="/giochi/hanoi" element={<HanoiPage />} />
        <Route path="/giochi/tower-of-london" element={<TowerOfLondonPage />} />
        <Route path="/giochi/memory" element={<MemoryPage />} />
        <Route path="/giochi/visual-memory" element={<VisualMemoryPage />} />
        <Route path="/giochi/digit-span" element={<DigitSpanPage />} />
        <Route path="/giochi/simon" element={<SimonPage />} />
        <Route path="/giochi/stroop" element={<StroopPage />} />
        <Route path="/giochi/trail-making" element={<TrailMakingPage />} />
        <Route path="/giochi/reaction" element={<ReactionPage />} />
        <Route path="/giochi/n-back" element={<NBackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
