import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserPlus, Trash2, Shield, ShieldOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [whitelist, setWhitelist] = useState([]);
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/', { replace: true });
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  async function loadData() {
    setFetching(true);
    const [{ data: wl }, { data: u }] = await Promise.all([
      supabase.from('whitelisted_emails').select('*').order('added_at'),
      supabase.from('profiles').select('*').order('created_at'),
    ]);
    setWhitelist(wl ?? []);
    setUsers(u ?? []);
    setFetching(false);
  }

  async function addToWhitelist(e) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAdding(true);
    const { error } = await supabase.from('whitelisted_emails').insert({
      email: newEmail.trim().toLowerCase(),
      name: newName.trim() || null,
      is_admin: newIsAdmin,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${newEmail} added`);
      setNewEmail('');
      setNewName('');
      setNewIsAdmin(false);
      loadData();
    }
    setAdding(false);
  }

  async function removeFromWhitelist(email) {
    const { error } = await supabase.from('whitelisted_emails').delete().eq('email', email);
    if (error) toast.error(error.message);
    else { toast.success(`${email} removed`); loadData(); }
  }

  async function toggleAdminFlag(email, current) {
    const { error } = await supabase
      .from('whitelisted_emails')
      .update({ is_admin: !current })
      .eq('email', email);
    if (error) toast.error(error.message);
    else loadData();
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFBF7' }}>
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4" style={{ backgroundColor: '#FDFBF7', minHeight: '100vh' }}>
      <h1 className="font-heading text-2xl mb-1" style={{ color: '#C05621' }}>Admin Panel</h1>
      <p className="font-body text-sm mb-6" style={{ color: '#8C7B75' }}>
        Manage who can access Shaadi Brain
      </p>

      {/* Add to whitelist */}
      <section className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <h2 className="font-body font-semibold text-sm mb-3" style={{ color: '#4A3A35' }}>
          Add Email to Whitelist
        </h2>
        <form onSubmit={addToWhitelist} className="flex flex-col gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="family@example.com"
            required
            className="font-body text-sm px-4 py-2.5 rounded-xl border outline-none"
            style={{ borderColor: '#E2D8D0', backgroundColor: '#FFF5F0', color: '#4A3A35' }}
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (optional)"
            className="font-body text-sm px-4 py-2.5 rounded-xl border outline-none"
            style={{ borderColor: '#E2D8D0', backgroundColor: '#FFF5F0', color: '#4A3A35' }}
          />
          <label className="flex items-center gap-2 font-body text-sm" style={{ color: '#4A3A35' }}>
            <input
              type="checkbox"
              checked={newIsAdmin}
              onChange={(e) => setNewIsAdmin(e.target.checked)}
              className="rounded"
            />
            Make admin
          </label>
          <button
            type="submit"
            disabled={adding}
            className="flex items-center justify-center gap-2 font-body font-semibold text-sm text-white rounded-full py-2.5 transition-opacity"
            style={{ backgroundColor: '#C05621', opacity: adding ? 0.75 : 1 }}
          >
            <UserPlus size={16} />
            {adding ? 'Adding...' : 'Add to Whitelist'}
          </button>
        </form>
      </section>

      {/* Whitelist */}
      <section className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <h2 className="font-body font-semibold text-sm mb-3" style={{ color: '#4A3A35' }}>
          Whitelisted Emails ({whitelist.length})
        </h2>
        {whitelist.length === 0 ? (
          <p className="font-body text-sm" style={{ color: '#8C7B75' }}>No emails yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {whitelist.map((w) => (
              <li
                key={w.email}
                className="flex items-center justify-between rounded-xl px-3 py-2"
                style={{ backgroundColor: '#FFF5F0' }}
              >
                <div>
                  <p className="font-body text-sm font-medium" style={{ color: '#4A3A35' }}>
                    {w.name || '—'}
                    {w.is_admin && (
                      <span
                        className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: '#C05621', color: '#fff' }}
                      >
                        admin
                      </span>
                    )}
                  </p>
                  <p className="font-body text-xs" style={{ color: '#8C7B75' }}>{w.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleAdminFlag(w.email, w.is_admin)}
                    title={w.is_admin ? 'Remove admin' : 'Make admin'}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white"
                    style={{ color: w.is_admin ? '#C05621' : '#8C7B75' }}
                  >
                    {w.is_admin ? <Shield size={16} /> : <ShieldOff size={16} />}
                  </button>
                  <button
                    onClick={() => removeFromWhitelist(w.email)}
                    title="Remove"
                    className="p-1.5 rounded-lg transition-colors hover:bg-white"
                    style={{ color: '#E53E3E' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Registered users */}
      <section className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-body font-semibold text-sm mb-3" style={{ color: '#4A3A35' }}>
          Registered Users ({users.length})
        </h2>
        {users.length === 0 ? (
          <p className="font-body text-sm" style={{ color: '#8C7B75' }}>No users have signed in yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-xl px-3 py-2"
                style={{ backgroundColor: '#FFF5F0' }}
              >
                <div>
                  <p className="font-body text-sm font-medium" style={{ color: '#4A3A35' }}>
                    {u.name}
                    {u.is_admin && (
                      <span
                        className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: '#C05621', color: '#fff' }}
                      >
                        admin
                      </span>
                    )}
                  </p>
                  <p className="font-body text-xs" style={{ color: '#8C7B75' }}>{u.email}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
