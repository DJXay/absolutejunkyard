export default function BrowsePage() {
  // Mock data to visualize the grid
  const items = [
    { id: 1, name: "Vintage Turntable", price: "$45", category: "Electronics", img: "📻" },
    { id: 2, name: "Old Garden Tools", price: "$15", category: "Tools", img: "⚒️" },
    { id: 3, name: "Soul 45s Bundle", price: "$20", category: "Music", img: "💿" },
    { id: 4, name: "Retro Desk Lamp", price: "$10", category: "Home", img: "💡" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Search Bar Area */}
      <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <h2 className="text-2xl font-bold text-slate-800 shrink-0">Browse Junk</h2>
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Search for treasures..." 
              className="w-full p-3 pl-10 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 p-6">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="w-full md:w-64 space-y-8 shrink-0">
          <div>
            <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Categories</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="hover:text-blue-600 cursor-pointer flex justify-between">Electronics <span>(12)</span></li>
              <li className="hover:text-blue-600 cursor-pointer flex justify-between">Tools <span>(8)</span></li>
              <li className="hover:text-blue-600 cursor-pointer flex justify-between">Music <span>(24)</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Price Range</h3>
            <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
            <div className="flex justify-between text-sm text-slate-500 mt-2">
              <span>$0</span>
              <span>$500+</span>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <main className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                <div className="h-48 bg-slate-100 flex items-center justify-center text-5xl group-hover:scale-110 transition duration-300">
                  {item.img}
                </div>
                <div className="p-5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-tighter">{item.category}</span>
                  <h4 className="text-lg font-bold text-slate-800 mt-1">{item.name}</h4>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xl font-black text-slate-900">{item.price}</span>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

      </div>
    </div>
  );
}
