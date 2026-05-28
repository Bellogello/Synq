import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [studyItems, setStudyItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  
  // NEW: Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formVisible, setFormVisible] = useState(true);
  const [currentRating, setCurrentRating] = useState(3);
  const [pulsingId, setPulsingId] = useState(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  
  const [topic, setTopic] = useState('');
  const [scope, setScope] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: subData } = await supabase.from('subjects').select('*').order('name');
    if (subData) setSubjects(subData);

    const { data: itemData } = await supabase
      .from('study_items')
      .select('*, subjects(name)')
      .order('created_at', { ascending: false });
    if (itemData) setStudyItems(itemData);
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return;
    
    const user_id = (await supabase.auth.getUser()).data.user.id;
    const { data, error } = await supabase
      .from('subjects')
      .insert([{ name: newSubjectName.trim(), user_id }])
      .select();

    if (!error && data) {
      setSubjects([...subjects, data[0]]);
      setSelectedSubjectId(data[0].id);
      setIsCreatingSubject(false);
      setNewSubjectName('');
    }
  };

  // NEW: Delete Subject Function
  const deleteSubject = async (subjectId) => {
    const subjectName = subjects.find(s => s.id === subjectId)?.name;
    
    if (!window.confirm(`Are you absolutely sure you want to delete "${subjectName}"? This will permanently delete ALL topics inside this subject!`)) {
      return;
    }

    // Optimistic UI Update: Instantly remove subject and all its related items from the screen
    setSubjects(subs => subs.filter(s => s.id !== subjectId));
    setStudyItems(items => items.filter(i => i.subject_id !== subjectId));
    if (selectedSubjectId === subjectId) setSelectedSubjectId('');

    // Database Delete
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId);

    if (error) console.error("Error deleting subject:", error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) return alert("Please select or create a subject first!");
    
    setIsAdding(true);
    const user_id = (await supabase.auth.getUser()).data.user.id;

    const newItem = {
      subject_id: selectedSubjectId,
      topic: topic.trim(),
      scope: scope.trim() || 'General Study',
      confidence: currentRating,
      completed: false,
      user_id
    };

    const { data, error } = await supabase
      .from('study_items')
      .insert([newItem])
      .select('*, subjects(name)');

    if (!error && data) {
      setStudyItems([data[0], ...studyItems]);
      setTopic('');
      setScope('');
      setCurrentRating(3);
    }
    setTimeout(() => setIsAdding(false), 1000);
  };

  const toggleComplete = async (id, currentStatus) => {
    if (!currentStatus) {
      setPulsingId(id);
      setTimeout(() => setPulsingId(null), 400);
    }
    setStudyItems(items => items.map(item => 
      item.id === id ? { ...item, completed: !currentStatus } : item
    ));
    await supabase.from('study_items').update({ completed: !currentStatus }).eq('id', id);
  };

  const deleteItem = async (id) => {
    setStudyItems(items => items.filter(i => i.id !== id));
    await supabase.from('study_items').delete().eq('id', id);
  };

  const total = studyItems.length;
  const doneCount = studyItems.filter(i => i.completed).length;
  const completionPct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const lowCount = studyItems.filter(i => i.confidence <= 2).length;
  const medCount = studyItems.filter(i => i.confidence === 3 || i.confidence === 4).length;
  const highCount = studyItems.filter(i => i.confidence === 5).length;

  // UPDATED: Combined Search and Filter Logic
  const filteredItems = studyItems.filter(item => {
    // 1. Existing Chip Filters
    let matchesChip = true;
    if (currentFilter === 'done') matchesChip = item.completed;
    else if (currentFilter === 'low') matchesChip = item.confidence <= 2;
    else if (currentFilter === 'med') matchesChip = item.confidence === 3 || item.confidence === 4;
    else if (currentFilter === 'high') matchesChip = item.confidence === 5;

    // 2. New Search Query Filter (Checks both Subject Name and Topic Name)
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      (item.subjects?.name || '').toLowerCase().includes(query) ||
      (item.topic || '').toLowerCase().includes(query);

    return matchesChip && matchesSearch;
  });

  return (
    <>
      {/* Session Overview */}
      <section className="glass-card rounded-xl p-4 space-y-4 sticky top-20 z-40 transition-shadow duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-on-surface-variant font-label-sm uppercase tracking-wider mb-0.5">Session Overview</p>
            <h2 className="font-headline-md text-[20px] text-on-surface">{total} Topic{total !== 1 && 's'}</h2>
          </div>
          <div className="text-right">
            <span className="text-primary font-display text-[28px] leading-none">{completionPct}%</span>
            <p className="text-on-surface-variant font-label-sm">Done</p>
          </div>
        </div>
        <div className="h-2 w-full bg-surface-variant/40 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-tertiary transition-all duration-700 ease-out" style={{ width: `${completionPct}%` }}></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/10 text-error border border-error/10 font-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>{lowCount} Low
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/10 text-tertiary border border-tertiary/10 font-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>{medCount} Med
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/10 text-primary border border-primary/10 font-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>{highCount} High
          </span>
        </div>
      </section>

      {/* New Objective Form */}
      <section className="space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-md text-[18px] text-on-surface">New Objective</h3>
          <button 
            onClick={() => setFormVisible(!formVisible)}
            className="material-symbols-outlined text-primary p-2 bg-primary-container/10 rounded-full hover:bg-primary-container/20 transition-all active:scale-95"
            style={{ transform: formVisible ? 'rotate(0deg)' : 'rotate(45deg)' }}
          >add</button>
        </div>
        
        <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: formVisible ? '600px' : '0px', opacity: formVisible ? '1' : '0' }}>
          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-4 space-y-4 border-primary/20">
            
            <div className="space-y-1">
              <div className="flex justify-between items-end px-1">
                <label className="font-label-md text-on-surface-variant text-sm">Subject</label>
                <button type="button" onClick={() => setIsCreatingSubject(!isCreatingSubject)} className="text-xs text-primary font-bold hover:underline">
                  {isCreatingSubject ? 'Cancel' : '+ New Subject'}
                </button>
              </div>

              {isCreatingSubject ? (
                <div className="flex gap-2">
                  <input 
                    type="text" autoFocus value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g. Physics 101" 
                    className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" 
                  />
                  <button type="button" onClick={handleCreateSubject} className="bg-surface-container-high text-primary font-bold px-4 rounded-lg border border-outline-variant/30 hover:border-primary transition-all text-sm">
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select 
                    value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} required
                    className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="" disabled>Select a Subject...</option>
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>

                  {/* NEW: Delete Subject Button */}
                  {selectedSubjectId && (
                    <button
                      type="button"
                      onClick={() => deleteSubject(selectedSubjectId)}
                      title="Delete this Subject"
                      className="w-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest border border-error/30 text-error hover:bg-error hover:text-white transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-on-surface-variant px-1 text-sm">Lecture / Topic</label>
              <input 
                type="text" required value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Kinematics" 
                className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="font-label-md text-on-surface-variant px-1 text-sm">Scope / Range</label>
              <input 
                type="text" value={scope} onChange={(e) => setScope(e.target.value)}
                placeholder="e.g. Ch. 4 or Slides 12-45" 
                className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" 
              />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <label className="font-label-md text-on-surface-variant block text-sm">Confidence</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} onClick={() => setCurrentRating(star)}
                      className={`material-symbols-outlined cursor-pointer transition-transform active:scale-125 ${star <= currentRating ? 'text-secondary' : 'text-on-surface-variant/30'}`}
                      style={{ fontVariationSettings: `'FILL' ${star <= currentRating ? 1 : 0}` }}
                    >star</span>
                  ))}
                </div>
              </div>
              <button disabled={isAdding || isCreatingSubject} type="submit" className="whitespace-nowrap flex-shrink-0 bg-primary text-on-primary font-bold px-5 py-2 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all hover:brightness-110 disabled:opacity-50 text-sm">
                {isAdding ? 'Adding...' : 'Add to Queue'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* NEW: Search Bar */}
      <section className="mt-8 px-1">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
          <input
            type="text"
            placeholder="Search subjects or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-on-surface-variant/40 transition-all"
          />
        </div>
      </section>

      {/* Filter Chips */}
      <section className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 mt-4">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'low', label: 'Low Conf.' },
          { id: 'med', label: 'Medium Conf.' },
          { id: 'high', label: 'High Conf.' },
          { id: 'done', label: 'Done' }
        ].map(filter => (
          <button 
            key={filter.id} onClick={() => setCurrentFilter(filter.id)}
            className={`whitespace-nowrap flex-shrink-0 px-4 py-1.5 rounded-full font-label-sm text-xs transition-all ${currentFilter === filter.id ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30 hover:border-outline-variant'}`}
          >{filter.label}</button>
        ))}
      </section>

      {/* Study List */}
      <section className="space-y-4 min-h-[200px] mt-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-4 animate-pulse">
            <span className="material-symbols-outlined text-[64px] text-surface-variant/40">search_off</span>
            <div>
              <p className="font-headline-md text-on-surface/60">No matching items</p>
              <p className="text-on-surface-variant/40 text-sm">Try adjusting your filters or search term.</p>
            </div>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className={`study-item-enter glass-card rounded-xl p-4 flex items-center gap-4 transition-all duration-300 relative overflow-hidden ${item.completed ? 'opacity-50 grayscale-[0.3]' : ''} ${pulsingId === item.id ? 'complete-pulse' : ''}`}>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase tracking-wider truncate max-w-[120px]">
                    {item.subjects?.name || 'Unknown'} 
                  </span>

                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`material-symbols-outlined text-[12px] ${star <= item.confidence ? 'text-secondary' : 'text-on-surface-variant/20'}`} style={{ fontVariationSettings: `'FILL' ${star <= item.confidence ? 1 : 0}` }}>star</span>
                    ))}
                  </div>
                </div>
                <h4 className={`font-bold text-on-surface truncate text-base ${item.completed ? 'line-through decoration-primary/50' : ''}`}>{item.topic}</h4>
                <p className="text-on-surface-variant/70 text-xs truncate">{item.scope}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button onClick={() => deleteItem(item.id)} className="material-symbols-outlined text-on-surface-variant/40 hover:text-error transition-all active:scale-90 flex-shrink-0">delete</button>
                <label className="relative flex items-center cursor-pointer group flex-shrink-0">
                  <input type="checkbox" checked={item.completed} onChange={() => toggleComplete(item.id, item.completed)} className="peer sr-only" />
                  <div className="w-7 h-7 rounded-lg border-2 border-outline-variant/30 peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all font-bold text-sm">check</span>
                  </div>
                </label>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}