import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Editor from './pages/Editor'
import Library from './pages/Library'
import './styles.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Editor />} />
          <Route path="library" element={<Library />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
