import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SquadWorkspace() {
  const { groupId } = useParams();
  const navigate = useNavigate(); // 🚨 NEW: Used to kick you out when a group is deleted
  
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [group, setGroup] = useState(null);
  
  const [studyItems, setStudyItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [squadProfiles, setSquadProfiles] = useState([]);
  const [squadNotes, setSquadNotes] = useState([]); 
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatScrollRef = useRef(null);
  
  const [topic, setTopic] = useState('');
  const [scope, setScope] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ topic: '', scope: '', notes: '' });
  const [expandedItemId, setExpandedItemId] = useState(null); 

  useEffect(() => {
    fetchWorkspaceData();

    // 🚨 NEW: Massive Realtime upgrade. Listens to Chat AND the Shared Queue!
    const channel = supabase.channel(`room_${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_items' }, () => fetchQueueDataSilent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions' }, () => fetchQueueDataSilent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_item_notes' }, () => fetchQueueDataSilent())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, () => {
         // If someone gets kicked out, force a refresh of the members list
         window.location.reload(); 
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [groupId]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages]);

  // Fetches EVERYTHING (Used on initial load)
  const fetchWorkspaceData = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    setUserId(user.id);
    setUserEmail(user.email);

    const { data: gData } = await supabase.from('study_groups').select('*').eq('id', groupId).single();
    if (gData) setGroup(gData);

    const { data: membersData } = await supabase.from('group_members').select('user_id').eq('group_id', groupId);
    if (membersData) {
      const memberIds = membersData.map(m => m.user_id);
      
      // Security Check: If you aren't in this list anymore (you got kicked), boot to home.
      if (!memberIds.includes(user.id)) return navigate('/groups');

      const { data: pData } = await supabase.from('profiles').select('*').in('id', memberIds);
      if (pData) setSquadProfiles(pData);
    }

    const { data: msgData } = await supabase.from('messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true });
    if (msgData) setMessages(msgData);

    await fetchQueueDataSilent();
  };

  // 🚨 NEW: Fetches only the task data so it can update in the background without breaking chat or typing
  const fetchQueueDataSilent = async () => {
    const { data: subData } = await supabase.from('subjects').select('*').eq('group_id', groupId);
    if (subData) setSubjects(subData);

    if (subData && subData.length > 0) {
      const subjectIds = subData.map(s => s.id);
      const { data: itemData } = await supabase.from('study_items').select('*, subjects(name)').in('subject_id', subjectIds).order('created_at', { ascending: false });
      if (itemData) setStudyItems(itemData);

      const itemIds = itemData ? itemData.map(i => i.id) : [];
      if (itemIds.length > 0) {
        const { data: compData } = await supabase.from('task_completions').select('*').in('item_id', itemIds);
        if (compData) setCompletions(compData);
        
        const { data: notesData } = await supabase.from('user_item_notes').select('*').in('item_id', itemIds);
        if (notesData) setSquadNotes(notesData);
      }
    } else {
      setStudyItems([]);
    }
  };

  // 🚨 NEW: OWNER COMMANDS 🚨
  const removeMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to kick this member?")) return;
    await supabase.from('group_members').delete().match({ group_id: groupId, user_id: memberId });
    setSquadProfiles(prev => prev.filter(p => p.id !== memberId));
  };

  const deleteWorkspace = async () => {
    if (!window.confirm("WARNING: This will permanently delete this workspace and all its tasks for EVERYONE. Continue?")) return;
    await supabase.from('study_groups').delete().eq('id', groupId);
    navigate('/groups');
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return;
    const { data, error } = await supabase.from('subjects').insert([{ name: newSubjectName.trim(), user_id: userId, group_id: groupId }]).select();
    if (error) return alert("Error: " + error.message);
    if (data) {
      setSubjects([...subjects, data[0]]);
      setSelectedSubjectId(data[0].id);
      setIsCreatingSubject(false);
      setNewSubjectName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) return alert("Select a subject!");
    
    const newItem = { subject_id: selectedSubjectId, topic: topic.trim(), scope: scope.trim(), user_id: userId, completed: false };
    const { data, error } = await supabase.from('study_items').insert([newItem]).select('*, subjects(name)');
    
    if (error) return alert("Database Error: " + error.message);
    
    if (data) {
      if (notes.trim()) {
        await supabase.from('user_item_notes').insert([{ item_id: data[0].id, user_id: userId, notes: notes.trim() }]);
      }
      setTopic(''); setScope(''); setNotes('');
    }
  };

  const saveEdit = async (id) => {
    setEditingId(null);
    await supabase.from('study_items').update({ topic: editData.topic, scope: editData.scope }).eq('id', id);
    if (editData.notes.trim()) {
      await supabase.from('user_item_notes').upsert({ item_id: id, user_id: userId, notes: editData.notes });
    } else {
      await supabase.from('user_item_notes').delete().match({ item_id: id, user_id: userId });
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this from the shared queue?")) return;
    await supabase.from('study_items').delete().eq('id', id);
  };

  const toggleMultiplayerComplete = async (itemId) => {
    const hasCompleted = completions.some(c => c.item_id === itemId && c.user_id === userId);
    if (hasCompleted) {
      await supabase.from('task_completions').delete().match({ item_id: itemId, user_id: userId });
    } else {
      await supabase.from('task_completions').insert([{ item_id: itemId, user_id: userId }]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempContent = newMessage.trim();
    setNewMessage(''); 
    
    const myProfile = squadProfiles.find(p => p.id === userId);
    const displayName = myProfile?.full_name || userEmail.split('@')[0];

    const { error } = await supabase.from('messages').insert([{
      group_id: groupId, user_id: userId, sender_email: displayName, content: tempContent
    }]);

    if (error) { alert("Failed to send: " + error.message); setNewMessage(tempContent); }
  };

  if (!group) return <div className="p-8 animate-pulse text-secondary font-bold text-[1.25rem]">Loading Workspace...</div>;

  const amIOwner = userId === group.owner_id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-[6rem]">
      
      {/* LEFT COLUMN: Controls, Members & Chat */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Workspace Header w/ Code */}
        <div className="glass-card rounded-xl p-6 border-secondary/30 border-2 shadow-lg shadow-secondary/5">
          <Link to="/groups" className="text-[0.75rem] text-on-surface-variant font-bold hover:text-primary mb-3 inline-block transition-colors">&larr; Back to Squads</Link>
          
          <div className="flex items-start justify-between gap-4">
             <div>
               <h2 className="font-headline-md text-[1.5rem] text-on-surface leading-tight">{group.name}</h2>
               <div className="mt-2 flex items-center gap-1 text-[0.75rem] font-bold text-on-surface-variant tracking-widest uppercase">
                  <span className="material-symbols-outlined text-[1rem] text-secondary">group</span>
                  Multiplayer Queue
               </div>
             </div>
             
             {/* 🚨 NEW: The Invite Code Display 🚨 */}
             <div className="bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/30 text-center flex-shrink-0">
                <p className="text-[0.625rem] text-on-surface-variant font-bold uppercase tracking-widest mb-0.5">Invite Code</p>
                <p className="font-display font-bold text-secondary text-[1.25rem] tracking-widest leading-none">{group.invite_code}</p>
             </div>
          </div>
        </div>

        {/* 🚨 NEW: SQUAD MEMBERS PANEL 🚨 */}
        <div className="glass-card rounded-xl p-5 border-outline-variant/20 shadow-md">
           <h3 className="font-headline-md text-[1.125rem] text-on-surface mb-4 flex items-center gap-2">
             <span className="material-symbols-outlined text-secondary">groups</span>
             Squad Members
           </h3>
           <div className="space-y-3">
             {squadProfiles.map(profile => {
                const isMe = profile.id === userId;
                const isOwner = profile.id === group.owner_id;

                return (
                  <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-lowest transition-colors">
                     <div className="flex items-center gap-3">
                       <img 
                         src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatar_seed}&backgroundColor=transparent`} 
                         className="w-10 h-10 rounded-full border border-outline-variant/20 bg-surface-container object-cover" 
                         alt={profile.full_name}
                       />
                       <div>
                         <p className="text-[0.875rem] font-bold text-on-surface flex items-center gap-2">
                           {profile.full_name} 
                           {isMe && <span className="text-[0.625rem] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                         </p>
                         {isOwner && <p className="text-[0.75rem] text-primary font-bold">Workspace Owner</p>}
                       </div>
                     </div>
                     
                     {/* Kick Button (Only visible if YOU are the owner, and you aren't trying to kick yourself) */}
                     {amIOwner && !isMe && (
                       <button onClick={() => removeMember(profile.id)} className="text-on-surface-variant/40 hover:text-error hover:bg-error/10 p-2 rounded-lg transition-all active:scale-95" title="Kick from workspace">
                          <span className="material-symbols-outlined text-[1.25rem]">person_remove</span>
                       </button>
                     )}
                  </div>
                )
             })}
           </div>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-5 space-y-4 shadow-md border-outline-variant/20">
          <h3 className="font-headline-md text-[1.125rem] text-on-surface mb-2">Add to Shared Queue</h3>
          <div className="space-y-1">
            <div className="flex justify-between items-end px-1">
              <label className="font-label-md text-on-surface-variant text-[0.875rem]">Squad Subject</label>
              <button type="button" onClick={() => setIsCreatingSubject(!isCreatingSubject)} className="text-[0.75rem] text-secondary font-bold hover:underline">
                {isCreatingSubject ? 'Cancel' : '+ New Subject'}
              </button>
            </div>
            {isCreatingSubject ? (
              <div className="flex gap-2">
                <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="e.g. Final Project" className="flex-1 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-secondary outline-none transition-all" />
                <button type="button" onClick={handleCreateSubject} className="bg-surface-container-high text-secondary hover:bg-secondary hover:text-white transition-colors font-bold px-4 rounded-lg text-[0.875rem]">Save</button>
              </div>
            ) : (
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} required className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-secondary outline-none transition-all cursor-pointer">
                <option value="" disabled>Select a Squad Subject...</option>
                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex gap-3">
            <div className="space-y-1 flex-1">
              <input type="text" required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-secondary outline-none transition-all" />
            </div>
            <div className="space-y-1 flex-1">
              <input type="text" value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Scope" className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-secondary outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-on-surface-variant px-1 text-[0.875rem]">My Initial Note (Optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a note for the squad to see..." rows="2" className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-secondary resize-none outline-none"></textarea>
          </div>
          <button type="submit" className="w-full bg-secondary text-on-primary font-bold py-2.5 rounded-xl active:scale-95 transition-transform text-[0.875rem] shadow-lg shadow-secondary/20 mt-2">Post to Squad</button>
        </form>

        <div className="glass-card rounded-xl p-4 flex flex-col min-h-[20rem] max-h-[30rem] border-outline-variant/20 flex-grow">
          <h3 className="font-headline-md text-[1.125rem] text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[1.25rem]">forum</span>
            Squad Chat
          </h3>
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar mb-3">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant/40 text-[0.875rem]">No messages yet. Say hi!</div>
            ) : (
              messages.map(msg => {
                const isMe = msg.user_id === userId;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[0.625rem] text-on-surface-variant font-bold mb-0.5 px-1 uppercase tracking-wider">
                      {isMe ? 'You' : msg.sender_email}
                    </span>
                    <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-[0.875rem] leading-relaxed ${isMe ? 'bg-secondary text-on-primary rounded-br-sm shadow-md' : 'bg-surface-container-highest text-on-surface border border-outline-variant/10 rounded-bl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 mt-auto">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Send a message..." className="flex-1 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-xl px-4 py-2 text-[0.875rem] focus:ring-1 focus:ring-secondary outline-none transition-all" />
            <button type="submit" disabled={!newMessage.trim()} className="bg-secondary text-on-primary w-[3rem] h-[2.75rem] rounded-xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-[1.25rem]">send</span>
            </button>
          </form>
        </div>

        {/* 🚨 NEW: DELETE WORKSPACE BUTTON (OWNER ONLY) 🚨 */}
        {amIOwner && (
           <button onClick={deleteWorkspace} className="w-full bg-error/10 text-error font-bold py-3 rounded-xl border border-error/20 hover:bg-error hover:text-white transition-all active:scale-95 text-[0.875rem] shadow-sm">
             Delete Entire Workspace
           </button>
        )}
      </div>

      {/* RIGHT COLUMN: The Shared Queue */}
      <div className="lg:col-span-7 space-y-4">
        {studyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 space-y-4 border-2 border-dashed border-outline-variant/20 rounded-2xl">
            <span className="material-symbols-outlined text-[4rem] text-surface-variant/40">group_work</span>
            <div>
              <p className="font-headline-md text-on-surface/60 text-[1.125rem]">Queue is empty</p>
              <p className="text-on-surface-variant/40 text-[0.875rem]">Add a topic on the left to start studying together.</p>
            </div>
          </div>
        ) : (
          studyItems.map(item => {
            const isEditing = editingId === item.id;
            const isExpanded = expandedItemId === item.id;
            const iCompletedIt = completions.some(c => c.item_id === item.id && c.user_id === userId);
            
            const completedProfiles = completions
              .filter(c => c.item_id === item.id)
              .map(c => squadProfiles.find(p => p.id === c.user_id))
              .filter(Boolean);
              
            const itemNotes = squadNotes.filter(n => n.item_id === item.id);

            return (
              <div key={item.id} className={`glass-card rounded-xl p-4 transition-all duration-300 border border-outline-variant/20 hover:border-secondary/30 ${iCompletedIt && !isEditing ? 'opacity-60 bg-secondary/5' : ''}`}>
                
                {isEditing ? (
                  <div className="space-y-3 w-full">
                    <div className="flex gap-2">
                      <input type="text" value={editData.topic} onChange={(e) => setEditData({...editData, topic: e.target.value})} className="flex-1 bg-surface-container-lowest border border-secondary/50 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-secondary outline-none" />
                      <input type="text" value={editData.scope} onChange={(e) => setEditData({...editData, scope: e.target.value})} className="w-[6rem] bg-surface-container-lowest border border-secondary/50 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-secondary outline-none" />
                    </div>
                    <textarea value={editData.notes} onChange={(e) => setEditData({...editData, notes: e.target.value})} rows="2" placeholder="My Note for the Squad..." className="w-full bg-surface-container-lowest border border-secondary/50 text-on-surface rounded-lg px-3 py-2 text-[0.875rem] focus:ring-1 focus:ring-secondary resize-none outline-none"></textarea>
                    
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="text-[0.75rem] font-bold text-on-surface-variant px-4 py-2 rounded-lg border border-outline-variant/30 hover:bg-surface-container-high transition-all">Cancel</button>
                      <button onClick={() => saveEdit(item.id)} className="text-[0.75rem] font-bold text-on-secondary bg-secondary px-4 py-2 rounded-lg active:scale-95 transition-all">Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[0.625rem] px-2 py-0.5 rounded-md bg-secondary/10 text-secondary font-bold uppercase tracking-wider truncate max-w-[10rem]">{item.subjects?.name}</span>
                        </div>
                        <h4 className={`font-bold text-on-surface text-[1.125rem] ${iCompletedIt ? 'line-through decoration-secondary/50' : ''}`}>
                          {item.topic} <span className="text-on-surface-variant/70 text-[0.875rem] font-normal ml-1">({item.scope})</span>
                        </h4>
                        
                        <div className="mt-3 flex items-center gap-3">
                          {/* The Completions Pile */}
                          {completedProfiles.length > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {completedProfiles.map((profile, idx) => (
                                  <img 
                                    key={idx}
                                    src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatar_seed}&backgroundColor=transparent`}
                                    title={profile.full_name}
                                    className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container-highest object-cover"
                                    alt="avatar"
                                  />
                                ))}
                              </div>
                              <span className="text-[0.625rem] text-on-surface-variant font-bold uppercase tracking-wider">
                                {completedProfiles.length} finished
                              </span>
                            </div>
                          )}

                          <button 
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                            className={`flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors ${itemNotes.length > 0 ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' : 'text-on-surface-variant hover:text-on-surface'}`}
                          >
                            <span className="material-symbols-outlined text-[1rem]">description</span>
                            {itemNotes.length} Note{itemNotes.length !== 1 ? 's' : ''}
                            <span className="material-symbols-outlined text-[1rem] transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-1 flex-shrink-0">
                        <button onClick={() => { 
                            setEditingId(item.id); 
                            const myNote = itemNotes.find(n => n.user_id === userId)?.notes || '';
                            setEditData({ topic: item.topic, scope: item.scope || '', notes: myNote }); 
                          }} 
                          className="material-symbols-outlined text-[1.25rem] text-on-surface-variant/40 hover:text-secondary transition-all flex-shrink-0"
                        >
                          edit
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="material-symbols-outlined text-[1.25rem] text-on-surface-variant/40 hover:text-error transition-all flex-shrink-0">delete</button>
                        <label className="relative flex items-center cursor-pointer group flex-shrink-0 ml-1">
                          <input type="checkbox" checked={iCompletedIt} onChange={() => toggleMultiplayerComplete(item.id)} className="peer sr-only" />
                          <div className="w-[2rem] h-[2rem] rounded-lg border-2 border-outline-variant/30 peer-checked:border-secondary peer-checked:bg-secondary transition-all flex items-center justify-center hover:bg-surface-container-high group-hover:border-secondary/50">
                            <span className="material-symbols-outlined text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all font-bold text-[1.125rem]">check</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                      <div className="overflow-hidden">
                        <div className="pt-4 border-t border-outline-variant/20 space-y-3">
                          {itemNotes.length === 0 ? (
                            <p className="text-[0.875rem] text-on-surface-variant/60 italic px-2">No squad notes yet. Click edit to add yours!</p>
                          ) : (
                            itemNotes.map(noteObj => {
                              const noteProfile = squadProfiles.find(p => p.id === noteObj.user_id);
                              const noteName = noteProfile?.full_name || 'Squad Member';
                              const noteAvatar = noteProfile?.avatar_url || (noteProfile?.avatar_seed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${noteProfile.avatar_seed}&backgroundColor=transparent` : null);
                              
                              return (
                                <div key={noteObj.user_id} className="flex gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10">
                                  {noteAvatar ? (
                                    <img src={noteAvatar} alt={noteName} className="w-8 h-8 rounded-full border border-outline-variant/20 object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                                      <span className="material-symbols-outlined text-[1.25rem] text-on-surface-variant">person</span>
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-[0.75rem] font-bold text-on-surface-variant mb-0.5">{noteName}</p>
                                    <p className="text-[0.875rem] text-on-surface whitespace-pre-wrap">{noteObj.notes}</p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}