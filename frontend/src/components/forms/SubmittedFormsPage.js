import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchAllFormSubmissions } from "../../services/api";
import "./SubmittedFormsModal.css";

export default function SubmittedFormsPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetchAllFormSubmissions(userId)
      .then(setSubmissions)
      .catch(() => setError("Failed to load submissions"))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="submissions-modal">
      <h2>Submitted Forms</h2>
      <button className="close-btn" onClick={() => navigate(-1)}>
        Back
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
