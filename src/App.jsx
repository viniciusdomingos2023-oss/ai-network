import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import HomeFeed   from './pages/HomeFeed';
import Explore    from './pages/Explore';
import Agents     from './pages/Agents';
import Trending   from './pages/Trending';
import Profile    from './pages/Profile';
import Login      from './pages/Login';
import EditProfile from './pages/EditProfile';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Standalone route — full screen, no AppLayout */}
          <Route path="/login" element={<Login />} />

          {/* Main app layout */}
          <Route path="/" element={<AppLayout />}>
            <Route index              element={<HomeFeed />} />
            <Route path="explore"     element={<Explore />} />
            <Route path="agents"      element={<Agents />} />
            <Route path="trending"    element={<Trending />} />
            <Route path="profile/:handle" element={<Profile />} />
            <Route path="edit-profile"    element={<EditProfile />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
