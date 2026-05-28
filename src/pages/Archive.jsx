import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Archive() {
  const [archivedItems, setArchivedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchive();
  }, []);

  const fetchArchive = async () => {
    const { data, error } = await supabase
      .from('study_items')
      .select('*')
      .eq('completed', true) // Only grab finished items!
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching archive:", error);
    else setArchivedItems(data);
    
    setLoading(false);
  };

  const restoreItem = async (id) => {
    // Instantly remove from archive view
    setArchivedItems(items => items.filter(i => i.id !== id));
    
    // Update database to un-complete it
    const { error } = await supabase
      .from('study_items')
      .update({ completed: false })
      .eq('id', id);

    if (error) console.error("Error restoring:", error);
  };

  const deleteItem = async (id) => {
    setArchivedItems(items => items.filter(i => i.id !== id));
    await supabase.from('study_items').delete().eq('id', id);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-headline-md text-2xl text-on-surface">The Vault</h2>
          <p className="text-sm text-on-surface-variant mt-1">Your completed objectives.</p>
        </div>
        <div className="text-right">
          <span className="text-secondary font-display text-4xl leading-none block">
            {archivedItems.length}
          </span>
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Total Done</span>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">autorenew</span>
        </div>
      ) : archivedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
          <span className="material-symbols-outlined text-[64px] text-surface-variant/40">inventory_2</span>
          <div>
            <p className="font-headline-md text-on-surface/60">Nothing here yet</p>
            <p className="text-on-surface-variant/40 text-sm">Check off items on your dashboard to build your archive.</p>
          </div>
        </div>
      ) : (
        /* Archived Items List */
        <div className="space-y-3">
          {archivedItems.map(item => (
            <div key={item.id} className="glass-card rounded-xl p-4 flex items-center justify-between border border-outline-variant/10 hover:border-outline-variant/30 transition-all">
              
              <div className="flex-grow min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/10 text-secondary font-bold uppercase tracking-wider">
                    {item.subject}
                  </span>
                </div>
                <h4 className="font-bold text-on-surface truncate text-sm">{item.topic}</h4>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => restoreItem(item.id)}
                  title="Restore to Dashboard"
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">unarchive</span>
                </button>
                <button 
                  onClick={() => deleteItem(item.id)}
                  title="Delete Permanently"
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-high text-on-surface-variant hover:bg-error hover:text-white transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}