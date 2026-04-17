import { useEffect, useState } from 'react';
import { useResourceStore } from '../stores/resourceStore';
import { useAuthStore } from '../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Filter, Plus, Info } from 'lucide-react';
import api from '../lib/api';

export default function ResourcesPage() {
  const { resources, fetchResources, isLoading, addResource } = useResourceStore();
  const user = useAuthStore(s => s.user);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  const categories = Array.from(new Set(resources.map(r => r.category)));

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat ? r.category === filterCat : true;
    return matchesSearch && matchesCat;
  });

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addResource({
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        totalCount: parseInt(formData.get('capacity') as string),
        availableCount: parseInt(formData.get('capacity') as string),
        location: formData.get('location') as string,
        metadata: {},
        status: 'active'
      });
      setShowAdd(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 neon-text-cyan" />
            Resource Directory
          </h1>
          <p className="text-sm text-cyan-100/50 mt-0.5">Browse and search available resources</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/30 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Resource
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 glass-panel p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-200/50" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2 glass-input rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-4 py-2 glass-input rounded-xl text-sm min-w-[150px] [&_option]:bg-slate-900">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredResources.map((resource, idx) => (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.05 }}
            key={resource.id}
            className="glass-panel border-white/10 p-5 rounded-2xl hover:border-cyan-500/30 transition-all flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]">
                {resource.category.charAt(0).toUpperCase()}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                resource.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                resource.status === 'maintenance' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' :
                'bg-white/5 border border-white/10 text-white/50'
              }`}>
                {resource.status}
              </span>
            </div>
            
            <h3 className="font-bold text-white mb-1 line-clamp-1">{resource.name}</h3>
            <p className="text-xs text-white/50 capitalize mb-4 flex-1">{resource.category.replace('_', ' ')} • {resource.location}</p>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">Availability</span>
                  <span className="font-bold neon-text-cyan">{resource.availableCount} / {resource.totalCount}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (resource.availableCount / resource.totalCount) > 0.2 ? 'bg-cyan-500 shadow-[0_0_8px_cyan]' : 'bg-red-500 shadow-[0_0_8px_red]'
                    }`}
                    style={{ width: `${(resource.availableCount / resource.totalCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button 
                onClick={() => setExpandedId(expandedId === resource.id ? null : resource.id)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold rounded-lg transition-colors flex justify-center items-center gap-1"
              >
                <Info className="w-3 h-3" /> Details
              </button>
              {expandedId === resource.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-xs text-cyan-100/70 p-3 bg-black/20 rounded-lg mt-1 border border-white/5">
                  <p><strong>Capacity:</strong> {resource.totalCount}</p>
                  <p><strong>Location:</strong> {resource.location}</p>
                  <p><strong>Status:</strong> {resource.status}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Resource Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-panel w-full max-w-md rounded-2xl p-6 border-cyan-500/30">
              <h2 className="text-xl font-bold neon-text-cyan mb-4">Add New Resource</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Name</label>
                  <input name="name" required className="w-full glass-input px-4 py-2 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Category</label>
                  <input name="category" required placeholder="e.g. lab_equipment" className="w-full glass-input px-4 py-2 rounded-xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Capacity</label>
                    <input name="capacity" type="number" required min="1" className="w-full glass-input px-4 py-2 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Location</label>
                    <input name="location" required className="w-full glass-input px-4 py-2 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-white/60 hover:text-white transition-colors text-sm">Cancel</button>
                  <button type="submit" className="neon-glow-btn px-6 py-2 rounded-xl font-bold text-sm">Create Resource</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
