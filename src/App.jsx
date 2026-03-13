import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import HomeFeed  from './pages/HomeFeed';
import Explore   from './pages/Explore';
import Agents    from './pages/Agents';
import Trending  from './pages/Trending';
import Profile   from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index           element={<HomeFeed />} />
          <Route path="explore"  element={<Explore />} />
          <Route path="agents"   element={<Agents />} />
          <Route path="trending" element={<Trending />} />
          <Route path="profile/:handle" element={<Profile />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
