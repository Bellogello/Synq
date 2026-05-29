import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    const user_id = (await supabase.auth.getUser()).data.user.id;
    
    // Fetch groups the user is a part of
    const { data, error } = await supabase
      .from('group_members')
      .select('study_groups(*)')
      .eq('user_id', user_id);

    if (data) {
      setGroups(data.map(d => d.study_groups));
    }
    setLoading(false);
  };

const createGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const user_id = (await supabase.auth.getUser()).data.user.id;
    const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 🚨 UPDATED: Added owner_id to the insert 🚨
    const { data: groupData, error: groupError } = await supabase
      .from('study_groups')
      .insert([{ name: newGroupName.trim(), invite_code, owner_id: user_id }])
      .select();

    if (groupError) return console.error(groupError);

    if (groupData) {
      await supabase.from('group_members').insert([{ group_id: groupData[0].id, user_id }]);
      setGroups([...groups, groupData[0]]);
      setNewGroupName('');
    }
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    const user_id = (await supabase.auth.getUser()).data.user.id;

    // 1. Find the group by invite code
    const { data: targetGroup } = await supabase
      .from('study_groups')
      .select('*')
      .eq('invite_code', joinCode.trim().toUpperCase())
      .single();

    if (!targetGroup) return alert("Invalid invite code!");

    // 2. Add user to the group
    const { error } = await supabase
      .from('group_members')
      .insert([{ group_id: targetGroup.id, user_id }]);

    if (error) {
      if (error.code === '23505') alert("You are already in this group!");
      else console.error(error);
    } else {
      setGroups([...groups, targetGroup]);
      setJoinCode('');
      alert(`Successfully joined ${targetGroup.name}!`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-[8rem] pt-[1rem]">
      <div>
        <h2 className="font-headline-md text-[1.5rem] text-on-surface">Study Squads</h2>
        <p className="text-[0.875rem] text-on-surface-variant mt-1">Create or join shared workspaces.</p>
      </div>

      {/* Join & Create Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Join Group */}
        <form onSubmit={joinGroup} className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <span className="material-symbols-outlined text-[1.5rem]">login</span>
            <h3 className="font-bold">Join a Squad</h3>
          </div>
          <input 
            type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-digit code" maxLength={6}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-4 py-3 text-[0.875rem] focus:ring-1 focus:ring-secondary uppercase tracking-widest text-center font-bold" 
          />
          <button type="submit" className="w-full bg-surface-container-high text-secondary hover:bg-secondary hover:text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-[0.875rem]">
            Join Room
          </button>
        </form>

        {/* Create Group */}
        <form onSubmit={createGroup} className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-[1.5rem]">add_circle</span>
            <h3 className="font-bold">Create a Squad</h3>
          </div>
          <input 
            type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="e.g. System Analysis Team" 
            className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-4 py-3 text-[0.875rem] focus:ring-1 focus:ring-primary" 
          />
          <button type="submit" className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-[0.875rem]">
            Generate Code
          </button>
        </form>
      </div>

      {/* My Groups List */}
      <div className="space-y-4 pt-4">
        <h3 className="font-headline-md text-[1.125rem] text-on-surface">My Workspaces</h3>
        
        {loading ? (
          <p className="text-on-surface-variant text-[0.875rem]">Loading squads...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-outline-variant/30 rounded-2xl">
            <p className="text-on-surface-variant/50 text-[0.875rem]">You aren't in any squads yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {groups.map(group => (
            <Link 
                key={group.id} 
                to={`/squad/${group.id}`} 
                className="glass-card p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between hover:border-primary/50 hover:bg-surface-container-highest transition-all active:scale-[0.98]"
            >
                <div>
                <h4 className="font-bold text-on-surface text-[1rem]">{group.name}</h4>
                <p className="text-[0.75rem] text-primary font-bold mt-1">Enter Workspace &rarr;</p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/20 px-4 py-2 rounded-lg flex items-center gap-3">
                <span className="text-[0.625rem] font-bold text-on-surface-variant uppercase tracking-widest">Code</span>
                <span className="font-display font-bold text-primary tracking-widest text-[1.125rem]">{group.invite_code}</span>
                </div>
            </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}