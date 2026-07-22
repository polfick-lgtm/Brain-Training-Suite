import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { HomePage } from '../pages/HomePage'
import { ProgressPage } from '../pages/ProgressPage'
import { ProfilePage } from '../pages/ProfilePage'
import { HanoiPage } from '../games/hanoi/HanoiPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/progressi" element={<ProgressPage />} />
        <Route path="/profilo" element={<ProfilePage />} />
        <Route path="/giochi/hanoi" element={<HanoiPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
