
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles,
  UserPlus,
  LayoutDashboard,
  ArrowRightLeft,
  Pencil,
  X,
  Check,
  Home,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { Member, Chore, TabType, Status } from './types';

// --- Local Storage Service ---
const STORAGE_KEY = 'fairshare_data';

const saveToLocalStorage = (data: { members: Member[], chores: Chore[] }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadFromLocalStorage = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { members: [], chores: [] };
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse local storage", e);
    return { members: [], chores: [] };
  }
};

// --- Components ---

const Avatar: React.FC<{ name: string; color: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, color, size = 'md' }) => {
  const initials = name ? name.substring(0, 2).toUpperCase() : '??';
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl'
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold shadow-sm ${color} border-2 border-white`}>
      {initials}
    </div>
  );
};

const EmptyState: React.FC<{ icon: React.ReactNode; message: string; submessage?: string; action?: () => void; actionText?: string }> = ({ 
  icon, message, submessage, action, actionText 
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-300">
    <div className="text-slate-200 mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-slate-700">{message}</h3>
    {submessage && <p className="text-slate-400 mt-1 max-w-xs">{submessage}</p>}
    {action && (
      <button 
        onClick={action}
        className="mt-6 text-indigo-600 font-medium hover:text-indigo-700 transition-colors flex items-center gap-2"
      >
        {actionText} &rarr;
      </button>
    )}
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newMemberName, setNewMemberName] = useState('');
  const [newChoreTitle, setNewChoreTitle] = useState('');
  const [newChorePoints, setNewChorePoints] = useState(10);

  // Editing States
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null);
  const [editChoreTitle, setEditChoreTitle] = useState('');

  const avatarColors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-rose-500'
  ];

  // --- Initial Load ---
  useEffect(() => {
    const data = loadFromLocalStorage();
    setMembers(data.members);
    setChores(data.chores);
    setLoading(false);
  }, []);

  // --- Auto Save ---
  useEffect(() => {
    if (!loading) {
      saveToLocalStorage({ members, chores });
    }
  }, [members, chores, loading]);

  // --- Actions ---

  const addMember = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    const newMember: Member = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      color: randomColor,
      createdAt: Date.now(),
      totalPoints: 0
    };
    
    setMembers(prev => [...prev, newMember]);
    setNewMemberName('');
  }, [newMemberName, avatarColors]);

  const deleteMember = useCallback((id: string) => {
    if (!window.confirm("Remove this person? Assigned chores will become unassigned.")) return;
    setMembers(prev => prev.filter(m => m.id !== id));
    setChores(prev => prev.map(c => c.assignedTo === id ? { ...c, assignedTo: null } : c));
  }, []);

  const startEditing = (member: Member) => {
    setEditingMemberId(member.id);
    setEditName(member.name);
  };

  const cancelEditing = () => {
    setEditingMemberId(null);
    setEditName('');
  };

  const saveMemberName = useCallback(() => {
    if (!editName.trim() || !editingMemberId) return;
    setMembers(prev => prev.map(m => m.id === editingMemberId ? { ...m, name: editName.trim() } : m));
    setEditingMemberId(null);
    setEditName('');
  }, [editName, editingMemberId]);

  const startEditingChore = (chore: Chore) => {
    setEditingChoreId(chore.id);
    setEditChoreTitle(chore.title);
  };

  const cancelEditingChore = () => {
    setEditingChoreId(null);
    setEditChoreTitle('');
  };

  const saveChoreTitle = useCallback(() => {
    if (!editChoreTitle.trim() || !editingChoreId) return;
    setChores(prev => prev.map(c => c.id === editingChoreId ? { ...c, title: editChoreTitle.trim() } : c));
    setEditingChoreId(null);
    setEditChoreTitle('');
  }, [editChoreTitle, editingChoreId]);

  const addChore = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoreTitle.trim()) return;

    const newChore: Chore = {
      id: Date.now().toString(),
      title: newChoreTitle.trim(),
      points: Number(newChorePoints) || 10,
      assignedTo: null,
      status: 'pending',
      createdAt: Date.now()
    };
    
    setChores(prev => [newChore, ...prev]);
    setNewChoreTitle('');
    setNewChorePoints(10);
  }, [newChoreTitle, newChorePoints]);

  const deleteChore = useCallback((id: string) => {
    setChores(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleChoreStatus = useCallback((choreId: string) => {
    setChores(prev => {
      const updated = prev.map(c => {
        if (c.id === choreId) {
          const newStatus: Status = c.status === 'completed' ? 'pending' : 'completed';
          
          // Update member points logic
          if (c.assignedTo) {
            const pointDiff = newStatus === 'completed' ? c.points : -c.points;
            setMembers(prevMembers => prevMembers.map(m => 
              m.id === c.assignedTo ? { ...m, totalPoints: Math.max(0, m.totalPoints + pointDiff) } : m
            ));
          }
          
          return { ...c, status: newStatus };
        }
        return c;
      });
      return updated;
    });
  }, []);

  const assignChoreTo = useCallback((choreId: string, memberId: string | null) => {
    setChores(prev => prev.map(c => {
      if (c.id === choreId) {
        const targetMemberId = memberId === 'unassign' ? null : memberId;
        
        // Handle point redistribution if already completed
        if (c.status === 'completed' && c.assignedTo !== targetMemberId) {
          setMembers(prevMembers => {
            let updated = [...prevMembers];
            // Subtract from old member
            if (c.assignedTo) {
              updated = updated.map(m => m.id === c.assignedTo ? { ...m, totalPoints: Math.max(0, m.totalPoints - c.points) } : m);
            }
            // Add to new member
            if (targetMemberId) {
              updated = updated.map(m => m.id === targetMemberId ? { ...m, totalPoints: m.totalPoints + c.points } : m);
            }
            return updated;
          });
        }
        return { ...c, assignedTo: targetMemberId };
      }
      return c;
    }));
  }, []);

  const autoAssignChores = useCallback(() => {
    if (members.length === 0) {
      alert("Add family members first!");
      return;
    }
    const unassignedPending = chores.filter(c => c.status === 'pending' && !c.assignedTo);
    if (unassignedPending.length === 0) {
      alert("No unassigned pending chores to distribute!");
      return;
    }

    const shuffledMembers = [...members].sort(() => Math.random() - 0.5);
    setChores(prev => {
      let unassignedCount = 0;
      return prev.map((c) => {
        if (c.status === 'pending' && !c.assignedTo) {
          const member = shuffledMembers[unassignedCount % shuffledMembers.length];
          unassignedCount++;
          return { ...c, assignedTo: member.id };
        }
        return c;
      });
    });
    
    alert(`Magic! Distributed chores among family members.`);
  }, [members, chores]);

  const unassignAll = useCallback(() => {
    if(!window.confirm("Unassign all pending chores?")) return;
    setChores(prev => prev.map(c => c.status === 'pending' ? { ...c, assignedTo: null } : c));
  }, []);

  const resetPoints = useCallback(() => {
    if(!window.confirm("Reset all points to zero? This cannot be undone.")) return;
    setMembers(prev => prev.map(m => ({ ...m, totalPoints: 0 })));
  }, []);

  // --- Computed States ---

  const unassignedChores = useMemo(() => chores.filter(c => !c.assignedTo && c.status === 'pending'), [chores]);
  
  const choresByMember = useMemo(() => {
    const map: Record<string, Chore[]> = {};
    members.forEach(m => map[m.id] = []);
    chores.forEach(c => {
      if (c.assignedTo && map[c.assignedTo]) {
        map[c.assignedTo].push(c);
      }
    });
    return map;
  }, [members, chores]);

  const statsData = useMemo(() => {
    return members.map(m => ({
      name: m.name,
      points: m.totalPoints,
      color: m.color.replace('bg-', '')
    })).sort((a, b) => b.points - a.points);
  }, [members]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-400">
        <Sparkles className="w-12 h-12 mb-4 animate-spin-slow text-indigo-500" />
        <p className="font-medium">Loading FairShare...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-8">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">FairShare</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Family Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
              <Users className="w-3.5 h-3.5" />
              {members.length} Members
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* VIEW: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Family Status</h2>
                <p className="text-slate-500">Track chores and celebrate progress</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={autoAssignChores}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md shadow-indigo-100 transition-all active:scale-95 text-sm font-semibold"
                >
                  <Sparkles className="w-4 h-4" />
                  Magic Split
                </button>
              </div>
            </div>

            {/* Unassigned Bucket */}
            {unassignedChores.length > 0 && (
              <section className="bg-orange-50 border border-orange-100 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertCircle className="w-24 h-24 text-orange-600" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                    <h3 className="text-sm font-bold text-orange-700 uppercase tracking-widest">Up for Grabs</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {unassignedChores.map(chore => (
                      <div key={chore.id} className="bg-white p-3.5 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between group">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{chore.title}</p>
                          <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">+{chore.points} PTS</span>
                        </div>
                        <select 
                          className="text-xs font-medium p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-orange-200"
                          onChange={(e) => assignChoreTo(chore.id, e.target.value)}
                          value=""
                        >
                          <option value="" disabled>Assign...</option>
                          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Members Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState 
                    icon={<Users className="w-16 h-16" />}
                    message="Your family is empty"
                    submessage="Start by adding family members in the Family tab."
                    action={() => setActiveTab('family')}
                    actionText="Add a family member"
                  />
                </div>
              ) : (
                members.map(member => (
                  <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-all group">
                    <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar name={member.name} color={member.color} />
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{member.name}</h3>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-tighter">
                            {choresByMember[member.id]?.filter(c => c.status === 'pending').length || 0} tasks pending
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-indigo-600">{member.totalPoints}</div>
                        <div className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Points</div>
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 min-h-[180px]">
                      {choresByMember[member.id]?.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-6">
                          <CheckCircle2 className="w-10 h-10 mb-2 opacity-10" />
                          <p className="text-sm font-medium">All caught up!</p>
                        </div>
                      ) : (
                        <ul className="space-y-2.5">
                          {choresByMember[member.id].map(chore => (
                            <li key={chore.id} className="group/item flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                              <button 
                                onClick={() => toggleChoreStatus(chore.id)}
                                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  chore.status === 'completed' 
                                    ? 'bg-green-500 border-green-500 text-white scale-110 shadow-sm' 
                                    : 'border-slate-300 hover:border-indigo-400 text-transparent'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <span className={`text-sm font-medium truncate block transition-all ${chore.status === 'completed' ? 'text-slate-400 line-through opacity-60' : 'text-slate-700'}`}>
                                  {chore.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <div className="relative group/reassign" title="Re-assign task">
                                    <button className="p-1.5 text-slate-300 hover:text-indigo-500 transition-colors bg-slate-100 rounded-lg">
                                        <ArrowRightLeft className="w-3 h-3" />
                                    </button>
                                    <select
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        value={member.id}
                                        onChange={(e) => assignChoreTo(chore.id, e.target.value)}
                                    >
                                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        <option value="unassign">Unassign</option>
                                    </select>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${chore.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {chore.points}P
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        {/* VIEW: MANAGE CHORES */}
        {activeTab === 'chores' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <LayoutDashboard className="w-6 h-6 text-indigo-500" />
                Task Repository
              </h2>
              <p className="text-slate-500">Define your household duties and manage assignments.</p>
            </div>
            
            <div className="p-8 border-b border-slate-200">
              <form onSubmit={addChore} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Title</label>
                  <input
                    type="text"
                    value={newChoreTitle}
                    onChange={(e) => setNewChoreTitle(e.target.value)}
                    placeholder="e.g. Mow the Lawn"
                    className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <div className="w-full md:w-32 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Point Value</label>
                  <input
                    type="number"
                    value={newChorePoints}
                    onChange={(e) => setNewChorePoints(Number(e.target.value))}
                    className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none text-center font-bold"
                    min="1"
                    max="1000"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!newChoreTitle.trim()}
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-100 transition-all font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Task
                </button>
              </form>
            </div>

            <div className="divide-y divide-slate-100 min-h-[300px]">
              {chores.length === 0 ? (
                <div className="p-20 text-center">
                  <EmptyState 
                    icon={<LayoutDashboard className="w-16 h-16 opacity-10" />}
                    message="No tasks defined"
                    submessage="Create chores above and assign point values to them."
                  />
                </div>
              ) : (
                chores.map(chore => (
                  <div key={chore.id} className="p-6 flex items-center justify-between hover:bg-slate-50 group transition-all">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-3 h-3 rounded-full ${chore.status === 'completed' ? 'bg-green-400' : 'bg-slate-300'} ring-4 ring-slate-50 flex-shrink-0`}></div>
                      <div className="flex-1">
                        {editingChoreId === chore.id ? (
                          <div className="flex items-center gap-2 max-w-sm">
                            <input 
                              type="text" 
                              value={editChoreTitle}
                              onChange={(e) => setEditChoreTitle(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-xl border-2 border-indigo-300 focus:ring-0 outline-none font-bold"
                              autoFocus
                            />
                            <button onClick={saveChoreTitle} className="p-1.5 text-green-600 hover:bg-green-50 rounded-xl">
                              <Check className="w-5 h-5" />
                            </button>
                            <button onClick={cancelEditingChore} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className={`font-bold text-lg ${chore.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                              {chore.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">{chore.points} PTS</span>
                              <span className="text-slate-300">•</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-400">Assigned:</span>
                                <select
                                  className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-none rounded-lg px-2 py-1 cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-indigo-200"
                                  value={chore.assignedTo || ""}
                                  onChange={(e) => assignChoreTo(chore.id, e.target.value || "unassign")}
                                >
                                  <option value="">Open / Unassigned</option>
                                  {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                  {chore.assignedTo && <option value="unassign">Unassign Task</option>}
                                </select>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {editingChoreId !== chore.id && (
                        <>
                          <button 
                            onClick={() => startEditingChore(chore)}
                            className="text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 p-2.5 rounded-xl transition-all"
                            title="Edit task name"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteChore(chore.id)}
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all"
                            title="Delete chore"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{chores.length} total tasks tracked</p>
              <button 
                onClick={unassignAll}
                className="text-xs text-slate-400 hover:text-red-600 font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                Clear All Assignments
              </button>
            </div>
          </div>
        )}

        {/* VIEW: MANAGE FAMILY */}
        {activeTab === 'family' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <Users className="w-6 h-6 text-indigo-500" />
                The Family
              </h2>
              <p className="text-slate-500">Add household members and manage their accounts.</p>
            </div>

            <div className="p-8 border-b border-slate-200">
              <form onSubmit={addMember} className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Member Name (e.g. Sarah, Max, Dad)"
                    className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!newMemberName.trim()}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-100 transition-all font-bold flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Invite
                </button>
              </form>
            </div>

            <div className="divide-y divide-slate-100">
              {members.length === 0 ? (
                <div className="p-20 text-center">
                  <EmptyState 
                    icon={<Users className="w-16 h-16 opacity-10" />}
                    message="Alone in the house?"
                    submessage="Add family members to start sharing the workload fairly."
                  />
                </div>
              ) : (
                members.map(member => (
                  <div key={member.id} className="p-6 flex items-center justify-between hover:bg-slate-50 group transition-all">
                    <div className="flex items-center gap-5 flex-1">
                      <Avatar name={member.name} color={member.color} size="lg" />
                      
                      {editingMemberId === member.id ? (
                        <div className="flex-1 flex items-center gap-2 max-w-sm">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-4 py-2 rounded-xl border-2 border-indigo-300 focus:ring-0 outline-none text-lg font-bold"
                            autoFocus
                          />
                          <button onClick={saveMemberName} className="p-2 text-green-600 hover:bg-green-50 rounded-xl">
                            <Check className="w-6 h-6" />
                          </button>
                          <button onClick={cancelEditing} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <p className="text-xl font-black text-slate-800">{member.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-bold text-indigo-500">{member.totalPoints} points earned</span>
                            <span className="text-slate-200">•</span>
                            <span className="text-xs font-medium text-slate-400">Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {editingMemberId !== member.id && (
                        <div className="flex items-center gap-2">
                            <button 
                              onClick={() => startEditing(member)}
                              className="text-slate-300 hover:text-indigo-500 p-3 rounded-xl hover:bg-indigo-50 transition-all"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => deleteMember(member.id)}
                              className="text-slate-300 hover:text-red-500 p-3 rounded-xl hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-200 flex justify-between items-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{members.length} members onboarded</p>
              <button 
                onClick={resetPoints}
                className="text-xs text-slate-400 hover:text-red-600 font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                Reset All Scores
              </button>
            </div>
          </div>
        )}

        {/* VIEW: STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
                Leaderboard
              </h2>
              
              {members.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                        dy={15}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="points" radius={[8, 8, 0, 0]} barSize={40}>
                        {statsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} className={`fill-current text-${entry.color.replace('500', '600')}`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon={<BarChart3 className="w-16 h-16 opacity-10" />} message="No data to visualize" submessage="Add members and complete chores to see progress." />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Points Awarded</p>
                  <p className="text-4xl font-black text-indigo-600">{members.reduce((acc, m) => acc + m.totalPoints, 0)}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Tasks Logged</p>
                  <p className="text-4xl font-black text-emerald-600">{chores.length}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Completion Rate</p>
                  <p className="text-4xl font-black text-amber-500">
                    {chores.length ? Math.round((chores.filter(c => c.status === 'completed').length / chores.length) * 100) : 0}%
                  </p>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile/Sticky Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 pb-safe md:pb-0 z-40">
        <div className="flex justify-around max-w-5xl mx-auto px-4">
          {[
            { id: 'dashboard', icon: Home, label: 'Home' },
            { id: 'chores', icon: LayoutDashboard, label: 'Chores' },
            { id: 'family', icon: Users, label: 'Family' },
            { id: 'stats', icon: BarChart3, label: 'Stats' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all relative ${
                activeTab === item.id 
                  ? 'text-indigo-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {activeTab === item.id && (
                <div className="absolute top-0 w-12 h-1 bg-indigo-600 rounded-b-full shadow-[0_4px_10px_rgba(79,70,229,0.3)]"></div>
              )}
              <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

    </div>
  );
}
