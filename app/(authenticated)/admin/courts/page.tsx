'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

interface Court {
  id: string;
  name: string;
  number: number;
  location: string | null;
  isActive: boolean;
  availability: CourtAvailability[];
}

interface CourtAvailability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function CourtsAdmin() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddCourt, setShowAddCourt] = useState(false);

  useEffect(() => {
    fetchCourts();
  }, []);

  async function fetchCourts() {
    try {
      const response = await fetch('/api/admin/courts');
      if (!response.ok) throw new Error('Failed to fetch courts');
      const data = await response.json();
      setCourts(data.courts || []);
    } catch (err) {
      setError('Failed to load courts');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddCourt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = (formData.get('name') as string)?.trim();
    const numberRaw = formData.get('number');
    const location = (formData.get('location') as string)?.trim();
    const parsedNumber =
      typeof numberRaw === 'string' && numberRaw.trim() !== ''
        ? Number.parseInt(numberRaw, 10)
        : Number.NaN;

    if (!name) {
      setError('Court name is required');
      return;
    }

    if (Number.isNaN(parsedNumber) || parsedNumber < 1) {
      setError('Court number must be a positive integer');
      return;
    }

    try {
      setError('');
      const response = await fetch('/api/admin/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          number: parsedNumber,
          location,
        }),
      });

      if (!response.ok) throw new Error('Failed to add court');

      await fetchCourts();
      setShowAddCourt(false);
      (event.target as HTMLFormElement).reset();
    } catch (err) {
      setError('Failed to add court');
    }
  }

  async function handleAddAvailability(courtId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/admin/courts/${courtId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: parseInt(formData.get('dayOfWeek') as string),
          startTime: formData.get('startTime'),
          endTime: formData.get('endTime'),
        }),
      });

      if (!response.ok) throw new Error('Failed to add availability');

      await fetchCourts();
      (event.target as HTMLFormElement).reset();
    } catch (err) {
      setError('Failed to add availability');
    }
  }

  async function handleDeleteAvailability(courtId: string, availabilityId: string) {
    if (!confirm('Are you sure you want to delete this time slot?')) return;

    try {
      const response = await fetch(`/api/admin/courts/${courtId}/availability/${availabilityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete availability');

      await fetchCourts();
    } catch (err) {
      setError('Failed to delete availability');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center">
                  <li>
                    <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                      Admin<span className="mx-2 text-gray-400">/</span>
                    </Link>
                  </li>
                  <li>
                    <span className="text-gray-900 font-medium">Courts</span>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">Court Management</h1>
            </div>
            <button
              onClick={() => setShowAddCourt(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Court
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {showAddCourt && (
          <div className="mb-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Add New Court</h3>
            <form onSubmit={handleAddCourt} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Court Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Court 1"
                  />
                </div>
                <div>
                  <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                    Court Number
                  </label>
                  <input
                    type="number"
                    name="number"
                    id="number"
                    min={1}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Main Building"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCourt(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Add Court
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">Loading courts...</div>
        ) : courts.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No courts have been added yet.</p>
            <button
              onClick={() => setShowAddCourt(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Your First Court
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {courts.map((court) => (
              <div key={court.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Court {court.number}: {court.name}
                    </h3>
                    {court.location && (
                      <p className="text-sm text-gray-500">{court.location}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    court.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {court.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Availability</h4>

                  {court.availability.length === 0 ? (
                    <p className="text-sm text-gray-500 mb-3">No availability set</p>
                  ) : (
                    <div className="mb-3 space-y-2">
                      {court.availability.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between text-sm">
                          <span>
                            {DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label}: {slot.startTime} - {slot.endTime}
                          </span>
                          <button
                            onClick={() => handleDeleteAvailability(court.id, slot.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={(e) => handleAddAvailability(court.id, e)} className="flex gap-2 items-end">
                    <div>
                      <label htmlFor={`day-${court.id}`} className="block text-xs font-medium text-gray-700">
                        Day
                      </label>
                      <select
                        name="dayOfWeek"
                        id={`day-${court.id}`}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`start-${court.id}`} className="block text-xs font-medium text-gray-700">
                        Start Time
                      </label>
                      <select
                        name="startTime"
                        id={`start-${court.id}`}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {TIME_SLOTS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`end-${court.id}`} className="block text-xs font-medium text-gray-700">
                        End Time
                      </label>
                      <select
                        name="endTime"
                        id={`end-${court.id}`}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {TIME_SLOTS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Add Time Slot
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
