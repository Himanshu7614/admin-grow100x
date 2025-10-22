'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  role: string;
}

interface ReferralData {
  referralCode: string;
  referralLinks: Array<{
    courseId: string;
    courseName: string;
    link: string;
  }>;
  totalReferredCount: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    fullName: ''
  });

  const API_BASE_URL = 'https://api.grow100x.ai/api/v1';

  useEffect(() => {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        fetchReferralData(userData.id);
      } catch (error) {
        localStorage.removeItem('adminUser');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Register or get user with just email and name
      const response = await axios.post(`${API_BASE_URL}/auth/admin/register`, {
        email: formData.email,
        fullName: formData.fullName
      });

      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('adminUser', JSON.stringify(userData));
        // Fetch referral data immediately
        await fetchReferralData(userData.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to access dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralData = async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/referral/admin/summary`, {
        headers: {
          'Authorization': `Bearer ${userId}` // Using userId as auth
        }
      });

      if (response.data.success) {
        setReferralData(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch referral data:', err);
    }
  };

  const generateReferralLink = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/referral/admin/code`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });

      if (response.data.success) {
        // Refresh referral data
        await fetchReferralData(user.id);
      }
    } catch (err: any) {
      setError('Failed to generate referral link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleLogout = () => {
    setUser(null);
    setReferralData(null);
    setFormData({ email: '', fullName: '' });
    localStorage.removeItem('adminUser');
  };

  if (!user) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="text-center mb-4">
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: '#333' }}>
              Grow100x Referral
            </h1>
            <p style={{ color: '#666' }}>
              Enter your details to access your referral dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                placeholder="Enter your full name"
              />
            </div>

            {error && (
              <div className="text-danger mb-4" style={{ textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Welcome, {user?.fullName}!
            </h1>
            <p style={{ color: '#666' }}>Admin Panel - Referral Management</p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div className="card" style={{ background: '#f8f9fa' }}>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>Referral Statistics</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Total Referrals:</span>
              <strong>{referralData?.totalReferredCount || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Total Earnings:</span>
              <strong className="text-success">₹{referralData?.totalEarnings || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pending Earnings:</span>
              <strong>₹{referralData?.pendingEarnings || 0}</strong>
            </div>
          </div>

          <div className="card" style={{ background: '#f8f9fa' }}>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>Your Referral Code</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <code style={{
                background: '#e9ecef',
                padding: '8px 12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                flex: 1
              }}>
                {referralData?.referralCode || 'Loading...'}
              </code>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(referralData?.referralCode || '')}
              >
                Copy
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <code style={{
                background: '#e9ecef',
                padding: '8px 12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                flex: 1
              }}>
                https://grow100x.ai/analyst?reffer={referralData?.referralCode || 'Loading...'}
              </code>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(`https://grow100x.ai/analyst?reffer=${referralData?.referralCode || ''}`)}
              >
                Copy
              </button>
            </div>
            <button
              onClick={generateReferralLink}
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Referral Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
