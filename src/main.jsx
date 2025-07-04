import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx' 
import Layout from './components/Layout.jsx'
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx'
import SourceFilesPage from './pages/SourceFilesPage.jsx';  
import InventoryPage from './pages/InventoryPage.jsx'; 
import RequirementsPage from './pages/RequirementsPage.jsx'; 
import ArtifactsPage from './pages/ArtifactsPage.jsx'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
       
        <Route element={<Layout />}>
          <Route path="/" element={<App />} />
          <Route path="/project/:projectId" element={<ProjectDetailsPage />} /> 
          <Route path="/project/:projectId/source-files" element={<SourceFilesPage />} /> 
          <Route path="/project/:projectId/inventory" element={<InventoryPage />} />
          <Route path="/project/:projectId/requirements" element={<RequirementsPage />} />
          <Route path="/project/:projectId/artifacts" element={<ArtifactsPage />} /> 
        </Route>  
      </Routes>
    </Router>
  </StrictMode>,
)