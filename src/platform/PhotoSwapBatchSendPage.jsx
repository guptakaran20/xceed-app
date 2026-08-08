// client/src/platform/PhotoSwapBatchSendPage.jsx

import React, { useEffect, useState } from 'react';
import { theme, styles, cssReset } from '../attendancemodule/config';

const apiUrl = import.meta.env.VITE_API_URL || '';

function batchYearFromRollNo(rollNo) {
  const prefix = String(rollNo).slice(0, 2);
  const yearNum = Number(prefix);
  if (Number.isNaN(yearNum)) return null;
  return yearNum < 50 ? `20${prefix}` : `19${prefix}`;
}

export default function PhotoSwapBatchSendPage() {
  const [allStudents, setAllStudents] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [rosterError, setRosterError] = useState(null);

  const [selectedBatch, setSelectedBatch] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/attendancemodule/student/`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to load students (HTTP ${res.status})`);
        return res.json();
      })
      .then((data) => setAllStudents(Array.isArray(data) ? data : []))
      .catch((err) => setRosterError(err.message))
      .finally(() => setLoadingRoster(false));
  }, []);

  const batchYears = Array.from(
    new Set(
      allStudents.map((s) => batchYearFromRollNo(s.rollNo)).filter(Boolean),
    ),
  ).sort((a, b) => b.localeCompare(a));

  const studentsInBatch = selectedBatch
    ? allStudents.filter((s) => batchYearFromRollNo(s.rollNo) === selectedBatch)
    : [];

  function handleBatchChange(e) {
    setSelectedBatch(e.target.value);
    setSendResults(null);
  }

  async function handleConfirmSend() {
    setConfirmOpen(false);
    setSending(true);
    setSendResults(null);
    try {
      const res = await fetch(
        `${apiUrl}/api/v1/attendancemodule/photo-swap/send-batch`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchYear: selectedBatch }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (HTTP ${res.status})`);
      setSendResults(data.results || []);
      const sentCount = (data.results || []).filter(
        (r) => r.status === 'sent',
      ).length;
      showToast(
        `Sent ${sentCount}/${(data.results || []).length} emails`,
        'success',
      );
    } catch (err) {
      showToast(err.message || 'Batch send failed', 'error');
    } finally {
      setSending(false);
    }
  }

  const sentCount = sendResults?.filter((r) => r.status === 'sent').length ?? 0;
  const failedCount =
    sendResults?.filter((r) => r.status !== 'sent').length ?? 0;

  return (
    <div style={styles.page}>
      <style>{cssReset}</style>

      {/* ── Confirm-send modal ── */}
      {confirmOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: `1px solid ${theme.accent}`,
              borderRadius: 12,
              padding: '32px 36px',
              maxWidth: 480,
              width: '90%',
              boxShadow: '0 24px 64px rgba(26,31,60,0.18)',
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                marginBottom: 14,
                color: theme.text,
              }}
            >
              Confirm batch send
            </div>
            <div
              style={{
                fontSize: 14,
                color: theme.textMuted,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              You&rsquo;re about to email{' '}
              <b style={{ color: theme.text }}>{studentsInBatch.length}</b>{' '}
              students in batch{' '}
              <b style={{ color: theme.text }}>{selectedBatch}</b>. Each will
              receive a one-time link valid for{' '}
              <b style={{ color: theme.text }}>24 hours</b> to update their
              photo. Proceed?
            </div>
            <div
              style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}
            >
              <button
                onClick={() => setConfirmOpen(false)}
                style={styles.btnGhost}
              >
                Cancel
              </button>
              <button onClick={handleConfirmSend} style={styles.btnPrimary}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 96,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9000,
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            animation: 'fadeIn 0.3s',
            background: toast.type === 'error' ? theme.danger : theme.success,
            color: '#ffffff',
            border: 'none',
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={styles.heading}>Photo Swap — Batch Send</div>
        <div style={styles.subheading}>
          Email a one-time, 24-hour photo update link to every student in a
          selected batch.
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: 16 }}>
        {loadingRoster && (
          <div style={{ color: theme.textMuted, fontSize: 13 }}>
            Loading roster…
          </div>
        )}

        {rosterError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: 14,
              background: theme.dangerDim,
              border: `1px solid ${theme.danger}`,
              fontSize: '13px',
              color: theme.danger,
            }}
          >
            {rosterError}
          </div>
        )}

        {!loadingRoster && !rosterError && (
          <div style={{ maxWidth: 260 }}>
            <label style={styles.label}>Batch Year</label>
            <select
              value={selectedBatch}
              onChange={handleBatchChange}
              style={styles.select}
            >
              <option value="">Select batch year...</option>
              {batchYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedBatch && studentsInBatch.length === 0 && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: 16,
            background: theme.warningDim,
            border: `1px solid ${theme.warning}`,
            fontSize: '13px',
            color: theme.warning,
          }}
        >
          No students found for batch {selectedBatch}.
        </div>
      )}

      {selectedBatch && studentsInBatch.length > 0 && (
        <>
          <div
            style={{
              ...styles.card,
              padding: 0,
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                background: theme.surfaceAlt,
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{ fontSize: '15px', fontWeight: 600, color: theme.text }}
              >
                Batch {selectedBatch}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: theme.textMuted,
                  fontFamily: theme.fontMono,
                }}
              >
                {studentsInBatch.length} student
                {studentsInBatch.length !== 1 ? 's' : ''}
              </div>
            </div>

            <table className="ams-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Email</th>
                  {sendResults && <th>Status</th>}
                </tr>
              </thead>
              <tbody>
                {studentsInBatch.map((s) => {
                  const result = sendResults?.find(
                    (r) => r.rollNo === s.rollNo,
                  );
                  return (
                    <tr key={s.rollNo}>
                      <td
                        style={{
                          fontFamily: theme.fontMono,
                          fontWeight: 600,
                          color: theme.text,
                        }}
                      >
                        {s.rollNo}
                      </td>
                      <td style={{ color: theme.text }}>{s.name}</td>
                      <td style={{ color: theme.textMuted }}>{s.dept}</td>
                      <td style={{ color: theme.textMuted }}>{s.mailID}</td>
                      {sendResults && (
                        <td>
                          {result ? (
                            <span
                              style={styles.badge(
                                result.status === 'sent' ? 'success' : 'danger',
                              )}
                            >
                              {result.status}
                            </span>
                          ) : (
                            <span
                              style={{ color: theme.textMuted, fontSize: 11 }}
                            >
                              unknown
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={sending}
              style={{
                ...styles.btnPrimary,
                opacity: sending ? 0.6 : 1,
                cursor: sending ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {sending && (
                <span
                  style={{
                    width: 13,
                    height: 13,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }}
                />
              )}
              {sending
                ? 'Sending…'
                : `Send links to ${studentsInBatch.length} students`}
            </button>
            {sendResults && (
              <div
                style={{
                  fontSize: '12px',
                  color: theme.textMuted,
                  fontFamily: theme.fontMono,
                }}
              >
                <span style={{ color: theme.success, fontWeight: 700 }}>
                  {sentCount} sent
                </span>
                {', '}
                <span style={{ color: theme.danger, fontWeight: 700 }}>
                  {failedCount} failed
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
