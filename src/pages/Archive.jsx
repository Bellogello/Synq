import { useState, useEffect } from 'react';

export default function Archive() {
  const [completedItems, setCompletedItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('synq_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCompletedItems(parsed.filter(item => item.completed));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-4 text-center">
        <h2 className="font-headline-md text-xl text-on-surface">Knowledge Vault</h2>
        <p className="text-on-surface-variant text-sm mt-1">You have mastered {completedItems.length} topics.</p>
      </div>

      <div className="space-y-4">
        {completedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-4 opacity-50">
            <span className="material-symbols-outlined text-6xl text-surface-variant/40">inventory_2</span>
            <p className="text-on-surface-variant text-sm">No completed topics yet. Keep pushing!</p>
          </div>
        ) : (
          completedItems.map(item => (
            <div key={item.id} className="glass-card rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-md bg-tertiary-container/20 text-tertiary font-bold uppercase tracking-wider">
                  {item.subject}
                </span>
                <span className="material-symbols-outlined text-tertiary text-sm">verified</span>
              </div>
              <h4 className="font-bold text-on-surface text-base">{item.topic}</h4>
            </div>
          ))
        )}
      </div>
    </div>
  );
}