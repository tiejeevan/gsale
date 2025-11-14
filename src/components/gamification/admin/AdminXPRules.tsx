import React, { useEffect, useState } from 'react';
import gamificationService, { type XPRule } from '../../../services/gamificationService';
import toast from 'react-hot-toast';

const AdminXPRules: React.FC = () => {
  const [rules, setRules] = useState<XPRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<XPRule>>({});

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await gamificationService.getXPRules();
      setRules(data);
    } catch (error) {
      toast.error('Failed to load XP rules');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (rule: XPRule) => {
    setEditingId(rule.id);
    setEditForm({
      xp_amount: rule.xp_amount,
      daily_limit: rule.daily_limit,
      weekly_limit: rule.weekly_limit,
      is_active: rule.is_active,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await gamificationService.updateXPRule(id, editForm);
      toast.success('XP rule updated successfully');
      setEditingId(null);
      loadRules();
    } catch (error) {
      toast.error('Failed to update XP rule');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 Tip: Adjust XP amounts and limits to balance your gamification system. Changes take effect immediately.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Action
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                XP Amount
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Daily Limit
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Weekly Limit
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800 dark:text-white">
                    {rule.action_type.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500">{rule.description}</div>
                </td>
                <td className="px-4 py-3">
                  {editingId === rule.id ? (
                    <input
                      type="number"
                      value={editForm.xp_amount}
                      onChange={(e) => setEditForm({ ...editForm, xp_amount: parseInt(e.target.value) })}
                      className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  ) : (
                    <span className="font-bold text-blue-600">+{rule.xp_amount}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === rule.id ? (
                    <input
                      type="number"
                      value={editForm.daily_limit || ''}
                      onChange={(e) => setEditForm({ ...editForm, daily_limit: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="None"
                      className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">
                      {rule.daily_limit || 'None'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === rule.id ? (
                    <input
                      type="number"
                      value={editForm.weekly_limit || ''}
                      onChange={(e) => setEditForm({ ...editForm, weekly_limit: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="None"
                      className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">
                      {rule.weekly_limit || 'None'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === rule.id ? (
                    <button
                      onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        editForm.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {editForm.is_active ? 'Active' : 'Inactive'}
                    </button>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        rule.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === rule.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(rule.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(rule)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminXPRules;
