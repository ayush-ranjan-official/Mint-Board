import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ArticlePage from './pages/Article'
import Publish from './pages/Publish'
import CreatorDashboard from './pages/CreatorDashboard'
import ReaderDashboard from './pages/ReaderDashboard'
import About from './pages/About'

export default function App() {
  return (
    <div>
      {/* Floating geometric shapes — visible on all pages */}
      <div className="bg-shapes">
        <div className="shape-ring" />
        <div className="shape-square" />
        <div className="shape-triangle" />
        <div className="shape-dots" />
        <div className="shape-cross" />
        <div className="shape-diamond" />
        <div className="shape-ring-lg" />
      </div>

      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:id" element={<ArticlePage />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="/creator" element={<CreatorDashboard />} />
        <Route path="/reader" element={<ReaderDashboard />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  )
}
