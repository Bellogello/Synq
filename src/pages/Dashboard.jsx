import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [studyItems, setStudyItems] = useState(() => {
    const saved = localStorage.getItem('synq_data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentFilter, setCurrentFilter] = useState('all');
  const [formVisible, setFormVisible] = useState(true);
  const [currentRating, setCurrentRating] = useState(3);
  const [pulsingId, setPulsingId] = useState(null);

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [range, setRange] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem('synq_data', JSON.stringify(studyItems));
  }, [studyItems]);

  const total = studyItems.length;
  const doneCount = studyItems.filter(i => i.completed).length;
  const completionPct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  
  const lowCount = studyItems.filter(i => i.confidence <= 2).length;
  const medCount = studyItems.filter(i => i.confidence === 3 || i.confidence === 4).length;
  const highCount = studyItems.filter(i => i.confidence === 5).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newItem = {
      id: Date.now(),
      subject: subject.trim(),
      topic: topic.trim(),
      range: range.trim() || 'General Study',
      confidence: currentRating,
      completed: false
    };

    setStudyItems([newItem, ...studyItems]);
    setSubject('');
    setTopic('');
    setRange('');
    setCurrentRating(3);
    
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 1500);
  };

  const toggleComplete = (id) => {
    setStudyItems(items => items.map(item => {
      if (item.id === id) {
        if (!item.completed) {
          setPulsingId(id);
          setTimeout(() => setPulsingId(null), 400);
        }
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  const deleteItem = (id) => {
    setStudyItems(items => items.filter(i => i.id !== id));
  };

  const filteredItems = studyItems.filter(item => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'done') return item.completed;
    if (currentFilter === 'low') return item.confidence <= 2;
    if (currentFilter === 'med') return item.confidence === 3 || item.confidence === 4;
    if (currentFilter === 'high') return item.confidence === 5;
    return true;
  });

  return (
    <>
      {/* Session Overview */}
      <section className="glass-card rounded-xl p-md space-y-md sticky top-20 z-40 transition-shadow duration-300">
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
          <div 
            className="h-full bg-gradient-to-r from-primary to-tertiary transition-all duration-700 ease-out" 
            style={{ width: `${completionPct}%` }}
          ></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/10 text-error border border-error/10 font-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            {lowCount} Low
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/10 text-tertiary border border-tertiary/10 font-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            {medCount} Med
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/10 text-primary border border-primary/10 font-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            {highCount} High
          </span>
        </div>
      </section>

      {/* New Objective Form */}
      <section className="space-y-md">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-md text-[18px] text-on-surface">New Objective</h3>
          <button 
            onClick={() => setFormVisible(!formVisible)}
            className="material-symbols-outlined text-primary p-2 bg-primary-container/10 rounded-full hover:bg-primary-container/20 transition-all active:scale-95"
            style={{ transform: formVisible ? 'rotate(0deg)' : 'rotate(45deg)' }}
          >
            add
          </button>
        </div>
        
        <div 
          className="overflow-hidden transition-all duration-300"
          style={{ maxHeight: formVisible ? '500px' : '0px', opacity: formVisible ? '1' : '0' }}
        >
          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-md space-y-md border-primary/20">
            <div className="space-y-sm">
              <label className="font-label-md text-on-surface-variant px-1">Subject & Topic</label>
              <div className="grid grid-cols-2 gap-sm">
                <input 
                  type="text" required value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="Calculus" 
                  className="bg-surface-container-lowest border-outline-variant/20 text-on-surface rounded-lg px-md py-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-on-surface-variant/40" 
                />
                <input 
                  type="text" required value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="Integration" 
                  className="bg-surface-container-lowest border-outline-variant/20 text-on-surface rounded-lg px-md py-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-on-surface-variant/40" 
                />
              </div>
            </div>
            
            <div className="space-y-sm">
              <label className="font-label-md text-on-surface-variant px-1">Scope / Range</label>
              <input 
                type="text" value={range} onChange={(e) => setRange(e.target.value)}
                placeholder="e.g. Slides 12-45 or Ch. 4" 
                className="w-full bg-surface-container-lowest border-outline-variant/20 text-on-surface rounded-lg px-md py-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-on-surface-variant/40" 
              />
            </div>
            
            <div className="flex items-center justify-between pt-sm">
              <div className="space-y-xs">
                <label className="font-label-md text-on-surface-variant block">Confidence</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} onClick={() => setCurrentRating(star)}
                      className={`material-symbols-outlined cursor-pointer transition-transform active:scale-125 ${star <= currentRating ? 'text-secondary' : 'text-on-surface-variant/30'}`}
                      style={{ fontVariationSettings: `'FILL' ${star <= currentRating ? 1 : 0}` }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
              
              <button type="submit" className="bg-primary text-on-primary font-bold px-lg py-sm rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all hover:brightness-110">
                {isAdding ? 'Added!' : 'Add to List'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Filter Chips */}
      <section className="flex gap-sm overflow-x-auto pb-sm no-scrollbar -mx-md px-md">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'low', label: 'Low Conf.' },
          { id: 'med', label: 'Medium Conf.' },
          { id: 'high', label: 'High Conf.' },
          { id: 'done', label: 'Done' }
        ].map(filter => (
          <button 
            key={filter.id} onClick={() => setCurrentFilter(filter.id)}
            className={`whitespace-nowrap px-lg py-2 rounded-full font-label-sm transition-all ${currentFilter === filter.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20'}`}
          >
            {filter.label}
          </button>
        ))}
      </section>

      {/* Study List */}
      <section className="space-y-md min-h-[200px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-xl space-y-md animate-pulse">
            <span className="material-symbols-outlined text-[64px] text-surface-variant/40">auto_stories</span>
            <div>
              <p className="font-headline-md text-on-surface/60">Your queue is empty</p>
              <p className="text-on-surface-variant/40 text-sm">Add a topic to begin your flow.</p>
            </div>
          </div>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              className={`study-item-enter glass-card rounded-xl p-md flex items-center gap-md transition-all duration-300 relative overflow-hidden ${item.completed ? 'opacity-50 grayscale-[0.3]' : ''} ${pulsingId === item.id ? 'complete-pulse' : ''}`}
            >
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase tracking-wider">
                    {item.subject}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star}
                        className={`material-symbols-outlined text-[12px] ${star <= item.confidence ? 'text-secondary' : 'text-on-surface-variant/20'}`}
                        style={{ fontVariationSettings: `'FILL' ${star <= item.confidence ? 1 : 0}` }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>
                <h4 className={`font-bold text-on-surface truncate text-base ${item.completed ? 'line-through decoration-primary/50' : ''}`}>
                  {item.topic}
                </h4>
                <p className="text-on-surface-variant/70 text-xs">{item.range}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button onClick={() => deleteItem(item.id)} className="material-symbols-outlined text-on-surface-variant/40 hover:text-error transition-all active:scale-90">
                  delete
                </button>
                <label className="relative flex items-center cursor-pointer group">
                  <input type="checkbox" checked={item.completed} onChange={() => toggleComplete(item.id)} className="peer sr-only" />
                  <div className="w-7 h-7 rounded-lg border-2 border-outline-variant/30 peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all font-bold text-sm">
                      check
                    </span>
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