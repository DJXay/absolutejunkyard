export default function PostItemPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-900 p-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">List Your Junk</h1>
          <p className="text-slate-400">One man's junk is another's treasure.</p>
        </div>

        {/* The Form */}
        <form className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Item Name</label>
            <input type="text" placeholder="e.g. Vintage Soul Records" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea rows={4} placeholder="Describe the condition, history, etc." className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Asking Price</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <input type="number" className="w-full p-3 pl-8 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option>Electronics</option>
                <option>Music/Records</option>
                <option>Tools</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Fee Notice: The "Admin" Logic */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-800 font-medium italic">Standard Listing Fee</span>
              <span className="text-lg font-bold text-blue-900">$1.00</span>
            </div>
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95">
            Post to the Junkyard
          </button>
        </form>
      </div>
    </div>
  )
}
