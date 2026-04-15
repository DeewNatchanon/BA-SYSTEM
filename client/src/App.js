import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import RequestForm from './pages/RequestForm';
import ProjectPortfolio from './pages/ProjectPortfolio';
import ApplicationPortfolio from './pages/ApplicationPortfolio';
import './index.css';

function App() {
  const backgroundStyle = {
    backgroundImage: `linear-gradient(rgba(234, 242, 251, 0.4), rgba(234, 242, 251, 0.4)), url(${process.env.PUBLIC_URL}/bangkok-hospital-phuket.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };

  return (
    <Router>
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logos">
            <img src="LOGO-BPK.png" alt="Bangkok Hospital Phuket" className="topbar-logo" />
            <img src="logo.png" alt="Greenline Synergy" className="topbar-logo" />
          </div>
          <div className="topbar-info">
            <div className="topbar-system">BA System</div>
          </div>
        </div>

        <nav className="topbar-nav" aria-label="Main navigation">
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/">Request</NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/projects">Projects</NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/applications">Applications</NavLink>
        </nav>
      </header>

      <main className="app-main" style={backgroundStyle}>
        <Routes>
          <Route path="/" element={<RequestForm />} />
          <Route path="/projects" element={<ProjectPortfolio />} />
          <Route path="/applications" element={<ApplicationPortfolio />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
