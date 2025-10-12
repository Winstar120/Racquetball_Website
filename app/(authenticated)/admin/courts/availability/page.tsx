'use client';

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';

type CourtOption = {
  id: string;
  name: string;
  location?: string | null;
};

type AvailabilityItem = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  court?: {
    id: string;
    name: string;
    location?: string | null;
  } | null;
};

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const totalMinutes = index * 15;
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

const baseInputStyle: CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  border: '1px solid #d1d5db',
  fontSize: '1rem',
  color: '#111827',
  outline: 'none',
  backgroundColor: 'white',
};

export default function GlobalAvailabilityPage() {
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    dayOfWeek: '1',
    startTime: '18:00',
    endTime: '19:00',
    courtId: '',
  });

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setFeedback(null);
    setError(null);
    try {
      const [availabilityRes, courtsRes] = await Promise.all([
        fetch('/api/admin/courts/global-availability', { credentials: 'include' }),
        fetch('/api/admin/courts', { credentials: 'include' }),
      ]);

      if (!availabilityRes.ok) throw new Error('Failed to load availability');
      if (!courtsRes.ok) throw new Error('Failed to load courts');

      const availabilityData = await availabilityRes.json();
      const courtsData = await courtsRes.json();

      setAvailability(availabilityData.availability ?? []);
      setCourts((courtsData.courts ?? []).map((court: any) => ({
        id: court.id,
        name: court.name,
        location: court.location,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  }

  const groupedAvailability = useMemo(() => {
    const groups = new Map<number, AvailabilityItem[]>();
    availability.forEach((item) => {
      if (!groups.has(item.dayOfWeek)) {
        groups.set(item.dayOfWeek, []);
      }
      groups.get(item.dayOfWeek)!.push(item);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [availability]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    setError(null);
    try {
      const payload = {
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        courtId: form.courtId || null,
      };

      if (payload.startTime >= payload.endTime) {
        throw new Error('End time must be after start time');
      }

      const response = await fetch('/api/admin/courts/global-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any).error ?? 'Failed to create availability');
      }

      await loadData();
      setFeedback('Availability slot created successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create availability');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(item: AvailabilityItem) {
    try {
      const response = await fetch(`/api/admin/courts/global-availability/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any).error ?? 'Failed to update slot');
      }

      setAvailability((prev) =>
        prev.map((slot) => (slot.id === item.id ? { ...slot, isActive: !slot.isActive } : slot))
      );
      setFeedback(`Availability ${!item.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update slot');
    }
  }

  async function deleteSlot(id: string) {
    if (!confirm('Remove this availability slot?')) return;
    try {
      const response = await fetch(`/api/admin/courts/global-availability/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any).error ?? 'Failed to delete slot');
      }

      setAvailability((prev) => prev.filter((slot) => slot.id !== id));
      setFeedback('Availability slot removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete slot');
    }
  }

  function displayCourt(item: AvailabilityItem) {
    if (!item.court) return 'Both courts';
    return item.court.location ? `${item.court.name} · ${item.court.location}` : item.court.name;
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div
        style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '1.5rem 1rem',
          }}
        >
          <nav style={{ display: 'flex' }} aria-label="Breadcrumb">
            <ol
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
                padding: 0,
                listStyle: 'none',
              }}
            >
              <li>
                <Link href="/admin/courts" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>
                  Courts
                </Link>
                <span style={{ margin: '0 0.5rem', color: '#9ca3af' }}>/</span>
              </li>
              <li>
                <span style={{ color: '#111827', fontWeight: 500, fontSize: '0.875rem' }}>Global Availability</span>
              </li>
            </ol>
          </nav>
          <h1
            style={{
              marginTop: '0.75rem',
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: '#111827',
              fontFamily: 'var(--font-playfair), Georgia, serif',
            }}
          >
            Global Court Availability
          </h1>
          <p
            style={{
              marginTop: '0.25rem',
              color: '#6b7280',
              fontSize: '0.95rem',
            }}
          >
            Configure the default time slots used when generating league schedules. Slots apply to all courts unless a specific court is selected.
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {(error || feedback) && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: error ? '#fef2f2' : '#ecfdf5',
              border: '1px solid ' + (error ? '#fecaca' : '#a7f3d0'),
              color: error ? '#b91c1c' : '#047857',
            }}
          >
            {error ?? feedback}
          </div>
        )}

        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Add Availability Slot
          </h2>
          <form
            onSubmit={handleCreate}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              alignItems: 'end',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#374151', marginBottom: '0.35rem' }}>Day</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
                style={baseInputStyle}
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#374151', marginBottom: '0.35rem' }}>Start</label>
              <select
                value={form.startTime}
                onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                style={baseInputStyle}
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#374151', marginBottom: '0.35rem' }}>End</label>
              <select
                value={form.endTime}
                onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                style={baseInputStyle}
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#374151', marginBottom: '0.35rem' }}>Court (optional)</label>
              <select
                value={form.courtId}
                onChange={(e) => setForm((prev) => ({ ...prev, courtId: e.target.value }))}
                style={baseInputStyle}
              >
                <option value="">Both courts</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.location ? `${court.name} · ${court.location}` : court.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'white',
                backgroundColor: isSubmitting ? '#4b5563' : '#1f2937',
                border: '1px solid ' + (isSubmitting ? '#4b5563' : '#1f2937'),
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.75 : 1,
                transition: 'all 0.2s',
              }}
            >
              {isSubmitting ? 'Adding…' : 'Add Slot'}
            </button>
          </form>
        </section>

        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Existing Slots
          </h2>
          {isLoading ? (
            <p style={{ color: '#6b7280' }}>Loading…</p>
          ) : availability.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No global availability configured yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {groupedAvailability.map(([day, slots]) => (
                <div key={day}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                    {DAYS.find((d) => d.value === day)?.label ?? `Day ${day}`}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid #e5e7eb',
                          padding: '0.75rem 1rem',
                          backgroundColor: 'white',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 500 }}>
                            {slot.startTime} – {slot.endTime}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{displayCourt(slot)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => toggleActive(slot)}
                            style={{
                              padding: '0.45rem 0.9rem',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              color: slot.isActive ? '#047857' : '#1f2937',
                              backgroundColor: slot.isActive ? '#ecfdf5' : '#f3f4f6',
                              border: '1px solid ' + (slot.isActive ? '#a7f3d0' : '#d1d5db'),
                              cursor: 'pointer',
                            }}
                          >
                            {slot.isActive ? 'Active' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteSlot(slot.id)}
                            style={{
                              padding: '0.45rem 0.9rem',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              color: '#b91c1c',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
