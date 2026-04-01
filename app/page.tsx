export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header / Hero */}
      <div className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            Absolute Junkyard
          </h1>
          <p className="text-xl text-slate-300">
            Post, Browse, and Trade. One man's Junk is another man's treasure.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* We will map your items here later */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="h-40 bg-slate-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-slate-400">Item Image</span>
            </div>
            <h3 className="font-bold text-lg">Vintage Electronics</h3>
            <p className="text-slate-600 text-sm mb-4">Perfect for a SoulZoneLive enthusiast.</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">
              View Details
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
