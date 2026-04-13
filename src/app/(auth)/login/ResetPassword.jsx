import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || searchParams.get('oobCode');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Authentication/ResetPassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token: tokenParam, password: newPassword }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Invalid or expired reset code. Please try again.");
      }

      setMessage("Password has been reset. You can now log in.");
    } catch (err) {
      console.error(err.message);
      setError(err.message || "Invalid or expired reset code. Please try again.");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!tokenParam) {
      setError("Reset link is invalid or missing.");
    }
  }, [tokenParam]);

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 rounded-xl shadow-lg border bg-white">
      <h2 className="text-2xl font-semibold mb-4">Reset Password</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message ? (
        <p className="text-green-600">{message}</p>
      ) : (
        <form onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded mb-4"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded mb-4"
          />
          <button
            type="submit"
          disabled={loading || !tokenParam}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
