import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  return (
    <>
      <div>
        <h1>Pintu Client</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            API URL: <code>{apiUrl}</code>
          </p>
        </div>
        <p className="read-the-docs">
          React + TypeScript + Vite + FastAPI
        </p>
      </div>
    </>
  )
}

export default App
