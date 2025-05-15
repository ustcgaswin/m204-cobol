import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx' // App.jsx is now the dashboard
import Layout from './components/Layout.jsx'
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx'
import SourceFilesPage from './pages/SourceFilesPage.jsx';  
import InventoryPage from './pages/InventoryPage.jsx'; // Import InventoryPage
import RequirementsPage from './pages/RequirementsPage.jsx'; // Import RequirementsPage
import ArtifactsPage from './pages/ArtifactsPage.jsx'; // Import ArtifactsPage

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        {/* All routes will use the main Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<App />} /> {/* App (dashboard) is at root, with Layout */}
          <Route path="/project/:projectId" element={<ProjectDetailsPage />} /> {/* Project Overview */}
          <Route path="/project/:projectId/source-files" element={<SourceFilesPage />} /> {/* Source Files Page */}
          <Route path="/project/:projectId/inventory" element={<InventoryPage />} />
          <Route path="/project/:projectId/requirements" element={<RequirementsPage />} />
          <Route path="/project/:projectId/artifacts" element={<ArtifactsPage />} /> {/* Add route for ArtifactsPage */}
          {/* ... other routes ... */}
        </Route>  
      </Routes>
    </Router>
  </StrictMode>,
)