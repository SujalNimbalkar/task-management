import React, { useEffect, useState } from "react";
import { fetchAllFormSubmissions } from "../../services/api";
import "./SubmittedFormsModal.css";

export default function SubmittedFormsModal({ userId, open, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setError(null);
    fetchAllFormSubmissions(userId)
      .then(setSubmissions)
      .catch(() => setError("Failed to load submissions"))
      .finally(() => setLoading(false));
  }, [open, userId]);

  if (!open) return null;

  return (
    <div className="submissions-modal">
      <h2>Submitted Forms</h2>
      <button className="close-btn" onClick={onClose}>
        Close
      </button>
      {isLoading ? (
        <div className="loading">Loading submissions...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : submissions.length === 0 ? (
        <div>No submissions found.</div>
      ) : (
        <ul className="submissions-list">
          {submissions.map((sub, idx) => (
            <li className="submission-item" key={sub.id || idx}>
              <div>
                <strong>Form:</strong> {sub.formName || sub.formId}
              </div>
              <div>
                <strong>Submitted At:</strong> {sub.submittedAt}
              </div>
              <div>
                <strong>Data:</strong>
                <pre className="submission-data">
                  {JSON.stringify(sub.formData, null, 2)}
                </pre>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
