export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          PixMorph - Intelligent Design Editor
        </h1>
        <div className="text-center">
          <p className="text-xl mb-4">
            Upload any image and let AI extract its elements for easy editing
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg">
              <h3 className="font-bold mb-2">🤖 AI Detection</h3>
              <p className="text-sm text-gray-600">
                Automatically separates design components
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-bold mb-2">✏️ Easy Editing</h3>
              <p className="text-sm text-gray-600">
                Drag, resize, and customize elements
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-bold mb-2">💾 Export</h3>
              <p className="text-sm text-gray-600">
                Save as PNG, JPEG, or PDF
              </p>
            </div>
          </div>
          <div className="mt-8">
            <a
              href="/editor"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
