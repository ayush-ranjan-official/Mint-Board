import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ArticlePage from './pages/Article'
import Publish from './pages/Publish'
import CreatorDashboard from './pages/CreatorDashboard'
import ReaderDashboard from './pages/ReaderDashboard'

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:id" element={<ArticlePage />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="/creator" element={<CreatorDashboard />} />
        <Route path="/reader" element={<ReaderDashboard />} />
      </Routes>
    </div>
  )
}
