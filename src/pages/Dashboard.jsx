import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [studyItems, setStudyItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formVisible, setFormVisible] = useState(true);
  const [currentRating, setCurrentRating] = useState(3);
  const [pulsingId, setPulsingId] = useState(null);
  
  const [expandedNotes, setExpandedNotes] = useState([]); 
  // 🚨 FIX: Changed to expandedFolders so they start collapsed by default
  const [expandedFolders, setExpandedFolders] = useState([]);

  // Creation State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [topic, setTopic] = useState('');
  const [scope, setScope] = useState('');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit Mode State
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ topic: '', scope: '', notes: '', confidence: 3 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: subData } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id) 
      .order('name');
    if (subData) setSubjects(subData);

    const { data: itemData } = await supabase
      .from('study_items')
      .select('*, subjects(name)')
      .eq('user_id', user.id)
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

  const deleteSubject = async (subjectId) => {
    const subjectName = subjects.find(s => s.id === subjectId)?.name;
    
    if (!window.confirm(`Are you absolutely sure you want to delete "${subjectName}"? This will permanently delete ALL topics inside this subject!`)) {
      return;
    }

    setSubjects(subs => subs.filter(s => s.id !== subjectId));
    setStudyItems(items => items.filter(i => i.subject_id !== subjectId));
    if (selectedSubjectId === subjectId) setSelectedSubjectId('');

    const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
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
      scope: scope.trim(),
      notes: notes.trim(),
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
      
      // Auto-expand the folder you just added a topic to!
      const addedSubjectName = data[0].subjects?.name || 'Uncategorized';
      if (!expandedFolders.includes(addedSubjectName)) {
         setExpandedFolders(prev => [...prev, addedSubjectName]);
      }

      setTopic('');
      setScope('');
      setNotes('');
      setCurrentRating(3);
    }
    setTimeout(() => setIsAdding(false), 1000);
  };

  const saveEdit = async (id) => {
    setStudyItems(items => items.map(item => item.id === id ? { ...item, ...editData } : item));
    setEditingId(null);
    
    const { error } = await supabase
      .from('study_items')
      .update({ 
        topic: editData.topic, 
        scope: editData.scope, 
        notes: editData.notes,
        confidence: editData.confidence 
      })
      .eq('id', id);

    if (error) console.error("Error updating item:", error);
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

  const toggleNote = (id) => {
    setExpandedNotes(prev => prev.includes(id) ? prev.filter(noteId => noteId !== id) : [...prev, id]);
  };

  // 🚨 FIX: Toggles the expanded state instead of collapsed
  const toggleFolder = (subjectName) => {
    setExpandedFolders(prev => 
      prev.includes(subjectName) 
        ? prev.filter(name => name !== subjectName) 
        : [...prev, subjectName]
    );
  };

  const total = studyItems.length;
  const doneCount = studyItems.filter(i => i.completed).length;
  const completionPct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const lowCount = studyItems.filter(i => i.confidence <= 2).length;
  const medCount = studyItems.filter(i => i.confidence === 3 || i.confidence === 4).length;
  const highCount = studyItems.filter(i => i.confidence === 5).length;

  const filteredItems = studyItems.filter(item => {
    let matchesChip = true;
    if (currentFilter === 'done') matchesChip = item.completed;
    else if (currentFilter === 'low') matchesChip = item.confidence <= 2;
    else if (currentFilter === 'med') matchesChip = item.confidence === 3 || item.confidence === 4;
    else if (currentFilter === 'high') matchesChip = item.confidence === 5;

    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      (item.subjects?.name || '').toLowerCase().includes(query) ||
      (item.topic || '').toLowerCase().includes(query) ||
      (item.notes || '').toLowerCase().includes(query);

    return matchesChip && matchesSearch;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    const subjectName = item.subjects?.name || 'Uncategorized';
    if (!acc[subjectName]) acc[subjectName] = [];
    acc[subjectName].push(item);
    return acc;
  }, {});

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start pb-[6rem]">
      
      {/* LEFT COLUMN */}
      <div className="lg:col-span-5 space-y-6">
        {/* Session Overview */}
        <section className="glass-card rounded-xl p-4 space-y-4 sticky top-[5rem] z-40 transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant font-label-sm uppercase tracking-wider mb-0.5">Session Overview</p>
              <h2 className="font-headline-md text-[1.25rem] text-on-surface">{total} Topic{total !== 1 && 's'}</h2>
            </div>
            <div className="text-right">
              <span className="text-primary font-display text-[1.75rem] leading-none">{completionPct}%</span>
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
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-[1.125rem] text-on-surface">New Objective</h3>
            <button 
              onClick={() => setFormVisible(!formVisible)}
              className="material-symbols-outlined text-primary p-2 bg-primary-container/10 rounded-full hover:bg-primary-container/20 transition-all active:scale-95"
              style={{ transform: formVisible ? 'rotate(0deg)' : 'rotate(45deg)' }}
            >add</button>
          </div>
          
          <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: formVisible ? '50rem' : '0px', opacity: formVisible ? '1' : '0' }}>
            <form onSubmit={handleSubmit} className="glass-card rounded-xl p-4 space-y-4 border-primary/20">
              <div className="space-y-1">
                <div className="flex justify-between items-end px-1">
                  <label className="font-label-md text-on-surface-variant text-[0.875rem]">Subject</label>
                  <button type="button" onClick={() => setIsCreatingSubject(!isCreatingSubject)} className="text-[0.75rem] text-primary font-bold hover:underline">
                    {isCreatingSubject ? 'Cancel' : '+ New Subject'}
                  </button>
                </div>

                {isCreatingSubject ? (
                  <div className="flex gap-2">
                    <input type="text" autoFocus value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="e.g. Physics 101" className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-primary focus:border-primary" />
                    <button type="button" onClick={handleCreateSubject} className="bg-surface-container-high text-primary font-bold px-4 rounded-lg border border-outline-variant/30 hover:border-primary transition-all text-[0.875rem]">Save</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} required className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-primary focus:border-primary">
                      <option value="" disabled>Select a Subject...</option>
                      {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                    </select>
                    {selectedSubjectId && (
                      <button type="button" onClick={() => deleteSubject(selectedSubjectId)} title="Delete this Subject" className="w-[2.5rem] flex flex-shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest border border-error/30 text-error hover:bg-error hover:text-white transition-all active:scale-95">
                        <span className="material-symbols-outlined text-[1.125rem]">delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <label className="font-label-md text-on-surface-variant px-1 text-[0.875rem]">Topic</label>
                  <input type="text" required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Kinematics" className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <label className="font-label-md text-on-surface-variant px-1 text-[0.875rem]">Scope</label>
                  <input type="text" value={scope} onChange={(e) => setScope(e.target.value)} placeholder="e.g. Ch. 4" className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-on-surface-variant px-1 text-[0.875rem]">Notes (Optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Formulas, key concepts..." rows="2" className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-primary focus:border-primary resize-none"></textarea>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1">
                  <label className="font-label-md text-on-surface-variant block text-[0.875rem]">Confidence</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} onClick={() => setCurrentRating(star)} className={`material-symbols-outlined cursor-pointer transition-transform active:scale-125 ${star <= currentRating ? 'text-secondary' : 'text-on-surface-variant/30'}`} style={{ fontVariationSettings: `'FILL' ${star <= currentRating ? 1 : 0}` }}>star</span>
                    ))}
                  </div>
                </div>
                <button disabled={isAdding || isCreatingSubject} type="submit" className="whitespace-nowrap flex-shrink-0 bg-primary text-on-primary font-bold px-5 py-2 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all hover:brightness-110 disabled:opacity-50 text-[0.875rem]">
                  {isAdding ? 'Adding...' : 'Add to Queue'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN */}
      <div className="lg:col-span-7 mt-8 lg:mt-0 space-y-4">
        <section className="px-1">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
            <input type="text" placeholder="Search subjects, topics, or notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-xl pl-10 pr-4 py-3 text-[0.875rem] focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-on-surface-variant/40 transition-all" />
          </div>
        </section>

        <section className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
          {[{ id: 'all', label: 'All Items' }, { id: 'low', label: 'Low Conf.' }, { id: 'med', label: 'Medium Conf.' }, { id: 'high', label: 'High Conf.' }, { id: 'done', label: 'Done' }].map(filter => (
            <button key={filter.id} onClick={() => setCurrentFilter(filter.id)} className={`whitespace-nowrap flex-shrink-0 px-4 py-1.5 rounded-full font-label-sm text-[0.75rem] transition-all ${currentFilter === filter.id ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30 hover:border-outline-variant'}`}>{filter.label}</button>
          ))}
        </section>

        <section className="min-h-[12.5rem]">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-4 animate-pulse">
              <span className="material-symbols-outlined text-[4rem] text-surface-variant/40">search_off</span>
              <div>
                <p className="font-headline-md text-on-surface/60">No matching items</p>
                <p className="text-on-surface-variant/40 text-[0.875rem]">Try adjusting your filters or search term.</p>
              </div>
            </div>
          ) : (
            // Render Grouped Subjects
            Object.entries(groupedItems).map(([subject, items]) => {
              // 🚨 FIX: Now checking if it is EXPANDED
              const isExpanded = expandedFolders.includes(subject);

              return (
                <div key={subject} className="mb-6">
                  <button 
                    onClick={() => toggleFolder(subject)}
                    className="w-full flex items-center justify-between text-left px-2 pb-2 mb-2 border-b border-outline-variant/20 hover:bg-surface-container-highest/50 transition-colors rounded-t-lg group"
                  >
                    <div className="flex items-center gap-2 text-on-surface-variant group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[1.25rem] text-primary">
                        {isExpanded ? 'folder_open' : 'folder'}
                      </span>
                      <h3 className="font-headline-sm">{subject}</h3>
                      <span className="text-[0.75rem] text-on-surface-variant/50 ml-1 font-bold bg-surface-container-highest px-2 py-0.5 rounded-full">
                        {items.length} {items.length === 1 ? 'topic' : 'topics'}
                      </span>
                    </div>
                    {/* 🚨 FIX: Arrow now points right when closed, down when open */}
                    <span className="material-symbols-outlined text-on-surface-variant/50 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                      expand_more
                    </span>
                  </button>
                  
                  {/* 🚨 FIX: Accordion logic flipped to match expanded state */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden space-y-3 px-1">
                      {items.map(item => {
                        const isEditing = editingId === item.id;
                        const isNoteExpanded = expandedNotes.includes(item.id);
                        
                        return (
                          <div key={item.id} className={`study-item-enter rounded-xl p-4 transition-all duration-300 relative overflow-hidden ${item.completed && !isEditing ? 'bg-surface-container border border-outline-variant/10 grayscale-[0.2]' : 'glass-card border border-outline-variant/20'} ${pulsingId === item.id ? 'complete-pulse' : ''}`}>
                            {isEditing ? (
                              <div className="space-y-3 w-full">
                                <div className="flex gap-2">
                                  <input type="text" value={editData.topic} onChange={(e) => setEditData({...editData, topic: e.target.value})} className="flex-1 bg-surface-container-lowest border border-primary/50 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-primary" />
                                  <input type="text" value={editData.scope} onChange={(e) => setEditData({...editData, scope: e.target.value})} className="w-[6rem] bg-surface-container-lowest border border-primary/50 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-primary" />
                                </div>
                                <textarea value={editData.notes} onChange={(e) => setEditData({...editData, notes: e.target.value})} rows="2" className="w-full bg-surface-container-lowest border border-primary/50 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-primary resize-none"></textarea>
                                
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex gap-1 items-center bg-surface-container-lowest px-2 py-1 rounded-lg border border-outline-variant/20">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span 
                                        key={star} 
                                        onClick={() => setEditData({...editData, confidence: star})}
                                        className={`material-symbols-outlined text-[1rem] cursor-pointer transition-transform active:scale-125 ${star <= editData.confidence ? 'text-secondary' : 'text-on-surface-variant/30'}`} 
                                        style={{ fontVariationSettings: `'FILL' ${star <= editData.confidence ? 1 : 0}` }}
                                      >star</span>
                                    ))}
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingId(null)} className="text-[0.75rem] font-bold text-on-surface-variant px-4 py-2 rounded-lg border border-outline-variant/30 hover:bg-surface-container-high transition-all">Cancel</button>
                                    <button onClick={() => saveEdit(item.id)} className="text-[0.75rem] font-bold text-on-primary bg-primary px-4 py-2 rounded-lg active:scale-95 transition-all">Save</button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-4">
                                <div className="flex-grow min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[0.625rem] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase tracking-wider truncate max-w-[7.5rem]">{item.subjects?.name || 'Unknown'}</span>
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} className={`material-symbols-outlined text-[0.75rem] ${star <= item.confidence ? 'text-secondary' : 'text-on-surface-variant/20'}`} style={{ fontVariationSettings: `'FILL' ${star <= item.confidence ? 1 : 0}` }}>star</span>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <h4 className={`font-bold truncate text-[1rem] ${item.completed ? 'line-through text-on-surface-variant decoration-on-surface-variant/60' : 'text-on-surface'}`}>
                                    {item.topic} <span className="opacity-70 text-[0.75rem] font-normal ml-1">({item.scope})</span>
                                  </h4>
                                  
                                  {item.notes && (
                                    <div className="mt-3">
                                      <button 
                                        onClick={() => toggleNote(item.id)}
                                        className={`flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors ${isNoteExpanded ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                                      >
                                        <span className="material-symbols-outlined text-[1rem]">description</span>
                                        {isNoteExpanded ? 'Hide Notes' : 'Show Notes'}
                                        <span className="material-symbols-outlined text-[1rem] transition-transform" style={{ transform: isNoteExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                      </button>
                                      
                                      <div className={`grid transition-all duration-300 ease-in-out ${isNoteExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                                        <div className="overflow-hidden">
                                          <div className="text-[0.875rem] text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10 whitespace-pre-wrap">
                                            {item.notes}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 pt-1 flex-shrink-0">
                                  <button onClick={() => { 
                                    setEditingId(item.id); 
                                    setEditData({ topic: item.topic, scope: item.scope || '', notes: item.notes || '', confidence: item.confidence || 3 }); 
                                  }} className="material-symbols-outlined text-[1.25rem] text-on-surface-variant/40 hover:text-primary transition-all flex-shrink-0">edit</button>
                                  <button onClick={() => deleteItem(item.id)} className="material-symbols-outlined text-[1.25rem] text-on-surface-variant/40 hover:text-error transition-all flex-shrink-0">delete</button>
                                  <label className="relative flex items-center cursor-pointer group flex-shrink-0 ml-1">
                                    <input type="checkbox" checked={item.completed} onChange={() => toggleComplete(item.id, item.completed)} className="peer sr-only" />
                                    <div className="w-[1.5rem] h-[1.5rem] rounded border-2 border-outline-variant/30 peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
                                      <span className="material-symbols-outlined text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all font-bold text-[0.875rem]">check</span>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}