import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, ShieldAlert, Sparkles, Users } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { FetchState } from '../components/ui/FetchState';
import {
  fetchAdminDashboardData,
  resolveModerationReport,
  suspendUser as suspendFirestoreUser,
  unsuspendUser as unsuspendFirestoreUser,
} from '../services/firebaseData';

export const AdminDashboardView = () => {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingUserId, setPendingUserId] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminDashboardData();
      setAnalytics(result.analytics);
      setUsers(result.users);
      setReports(result.reports || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSuspension = async (targetUser) => {
    setPendingUserId(targetUser.id);
    setError('');
    try {
      if (targetUser.status === 'suspended') {
        await unsuspendFirestoreUser(targetUser.id);
        setUsers((current) =>
          current.map((item) => (item.id === targetUser.id ? { ...item, status: 'active' } : item))
        );
      } else {
        await suspendFirestoreUser(targetUser.id);
        setUsers((current) =>
          current.map((item) => (item.id === targetUser.id ? { ...item, status: 'suspended' } : item))
        );
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingUserId(null);
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      await resolveModerationReport(reportId);
      setReports((curr) => curr.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r)));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    let active = true;
    fetchAdminDashboardData()
      .then((result) => {
        if (!active) return;
        setAnalytics(result.analytics);
        setUsers(result.users);
        setReports(result.reports || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vibely Admin Console</h1>
          <p className="text-xs text-slate-500">Real-time Firestore system health, user accounts, and content moderation.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Accounts', value: analytics.totalAccounts ?? '—', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
            { label: 'Active Vibes Today', value: analytics.activeToday ?? '—', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
            { label: 'Shared Moments', value: analytics.transcriptsProcessed ?? '—', icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950' },
            { label: 'Pending Reports', value: analytics.pendingReports ?? 0, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Management Table */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">System Accounts ({users.length})</h2>
          </div>
          <FetchState loading={loading} error={error} onRetry={loadAdminData}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="p-4">User</th>
                    <th className="p-4">Vibe</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-4 flex items-center space-x-3">
                        <Avatar src={u.avatar} name={u.name} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-400">@{u.username}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">{u.vibe || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${u.role === 'admin' ? 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${u.status === 'suspended' ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          disabled={pendingUserId === u.id}
                          onClick={() => toggleUserSuspension(u)}
                          className={`${u.status === 'suspended' ? 'text-emerald-600' : 'text-rose-500'} hover:underline disabled:opacity-60 font-semibold`}
                        >
                          {pendingUserId === u.id
                            ? 'Updating...'
                            : u.status === 'suspended'
                              ? 'Reactivate'
                              : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FetchState>
        </div>

        {/* Moderation Reports Table */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Moderation Reports ({reports.length})</h2>
          </div>
          {reports.length === 0 ? (
            <p className="p-6 text-xs text-slate-400 text-center">No moderation reports submitted.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{rep.reason}</p>
                    <p className="text-[11px] text-slate-400">
                      Reported by {rep.reporterName || rep.reporterId} • Target: {rep.targetType} ({rep.targetId})
                    </p>
                  </div>
                  {rep.status === 'resolved' ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Resolved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolveReport(rep.id)}
                      className="bg-violet-600 text-white px-3 py-1.5 rounded-xl font-bold"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
