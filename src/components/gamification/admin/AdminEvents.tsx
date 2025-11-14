import React, { useEffect, useState } from 'react';
import gamificationService, { type SeasonalEvent } from '../../../services/gamificationService';
import toast from 'react-hot-toast';

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SeasonalEvent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    xp_multiplier: 2.0,
    event_type: 'xp_boost',
    is_active: true,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await gamificationService.getAdminEvents();
      setEvents(data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await gamificationService.updateEvent(editingEvent.id, formData);
        toast.success('Event updated successfully');
      } else {
        await gamificationService.createEvent(formData);
        toast.success('Event created successfully');
      }
      resetForm();
      loadEvents();
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await gamificationService.deleteEvent(id);
      toast.success('Event deleted successfully');
      loadEvents();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const startEdit = (event: SeasonalEvent) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      start_date: new Date(event.start_date).toISOString().slice(0, 16),
      end_date: new Date(event.end_date).toISOString().slice(0, 16),
      xp_multiplier: event.xp_multiplier,
      event_type: event.event_type,
      is_active: event.is_active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      xp_multiplier: 2.0,
      event_type: 'xp_boost',
      is_active: true,
    });
    setEditingEvent(null);
    setShowModal(false);
  };

  const isEventActive = (event: SeasonalEvent) => {
    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    return event.is_active && now >= start && now <= end;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            Seasonal Events
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create time-limited events with XP multipliers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Create Event
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 ${
              isEventActive(event)
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                    {event.name}
                  </h4>
                  {isEventActive(event) && (
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold animate-pulse">
                      🔴 LIVE
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    event.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {event.is_active ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{event.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Start Date</div>
                    <div className="font-semibold text-gray-800 dark:text-white">
                      {new Date(event.start_date).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">End Date</div>
                    <div className="font-semibold text-gray-800 dark:text-white">
                      {new Date(event.end_date).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">XP Multiplier</div>
                    <div className="font-bold text-blue-600 text-lg">
                      {event.xp_multiplier}x
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Type</div>
                    <div className="font-semibold text-gray-800 dark:text-white">
                      {event.event_type}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => startEdit(event)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">No events created yet</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    XP Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={formData.xp_multiplier}
                    onChange={(e) => setFormData({ ...formData, xp_multiplier: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Type
                  </label>
                  <input
                    type="text"
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="xp_boost"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
