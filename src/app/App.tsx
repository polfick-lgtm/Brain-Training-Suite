import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { GamesPage } from '../pages/GamesPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProgressPage } from '../pages/ProgressPage'
import { ProfilePage } from '../pages/ProfilePage'
import { SessionsPage } from '../pages/SessionsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { HanoiPage } from '../games/hanoi/HanoiPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/giochi" element={<GamesPage />} />
        <Route path="/sessioni" element={<SessionsPage />} />
        <Route path="/progressi" element={<ProgressPage />} />
        <Route path="/profilo" element={<ProfilePage />} />
        <Route path="/impostazioni" element={<SettingsPage />} />
        <Route path="/giochi/hanoi" element={<HanoiPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
