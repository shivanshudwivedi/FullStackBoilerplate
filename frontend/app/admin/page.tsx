'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { formatDate, formatRelativeTime, getStatusBadgeClass, getStatusText } from '../../lib/utils';

interface Assessment {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_active: boolean;
}

interface DashboardStats {
  total_assessments: number;
  total_candidates: number;
  average_score: number;
  pass_rate: number;
}

interface FunnelData {
  stage: string;
  count: number;
}

interface PerformanceData {
  title: string;
  average_score: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  assessment_title: string;
  stack_rank_score: number;
  status: string;
}

export default function AdminDashboard() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [funnel, setFunnel] = useState<FunnelData[]>([]);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all data in parallel
      const [assessmentsRes, statsRes, funnelRes, performanceRes, leaderboardRes] = await Promise.allSettled([
        api.get('/assessments'),
        api.get('/dashboard/stats'),
        api.get('/dashboard/funnel'),
        api.get('/dashboard/performance'),
        api.get('/dashboard/leaderboard')
      ]);

      // Handle assessments
      if (assessmentsRes.status === 'fulfilled') {
        setAssessments(assessmentsRes.value.data.assessments || []);
      }

      // Handle stats
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      // Handle funnel
      if (funnelRes.status === 'fulfilled') {
        setFunnel(funnelRes.value.data);
      }

      // Handle performance
      if (performanceRes.status === 'fulfilled') {
        setPerformance(performanceRes.value.data);
      }

      // Handle leaderboard
      if (leaderboardRes.status === 'fulfilled') {
        setLeaderboard(leaderboardRes.value.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMaxFunnelCount = () => {
    return Math.max(...funnel.map(item => item.count), 1);
  };

  const getFunnelPercentage = (count: number) => {
    const max = getMaxFunnelCount();
    return (count / max) * 100;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const formatScore = (score: number) => {
    return score ? score.toFixed(1) : '0.0';
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-icon">📊</div>
            <div>
              <h1 className="gradient-text">Admin Dashboard</h1>
              <p className="header-subtitle">Monitor assessments and track candidate performance</p>
            </div>
          </div>
          <Link href="/admin/assessments/new" className="btn btn-primary btn-glow">
            <span className="btn-icon">+</span>
            Create Assessment
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner-modern"></div>
            <p className="loading-text">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            {stats && (
              <div className="stats-grid">
                <div className="stat-card stat-card-primary">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.total_assessments}</div>
                    <div className="stat-label">Total Assessments</div>
                  </div>
                  <div className="stat-trend">Active</div>
                </div>

                <div className="stat-card stat-card-success">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.total_candidates}</div>
                    <div className="stat-label">Total Candidates</div>
                  </div>
                  <div className="stat-trend">Invited</div>
                </div>

                <div className="stat-card stat-card-info">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <div className="stat-value">{formatScore(stats.average_score)}</div>
                    <div className="stat-label">Average Score</div>
                  </div>
                  <div className="stat-trend">Rating</div>
                </div>

                <div className="stat-card stat-card-warning">
                  <div className="stat-icon">✓</div>
                  <div className="stat-content">
                    <div className="stat-value">{formatScore(stats.pass_rate)}%</div>
                    <div className="stat-label">Pass Rate</div>
                  </div>
                  <div className="stat-trend">Success</div>
                </div>
              </div>
            )}

            {/* Analytics Section */}
            <div className="analytics-grid">
              {/* Candidate Funnel */}
              {funnel.length > 0 && (
                <div className="analytics-card">
                  <div className="card-header">
                    <h3 className="card-title">
                      <span className="title-icon">📈</span>
                      Candidate Funnel
                    </h3>
                  </div>
                  <div className="funnel-chart">
                    {funnel.map((item, index) => (
                      <div key={item.stage} className="funnel-stage">
                        <div className="funnel-label">
                          <span className="stage-name">{item.stage}</span>
                          <span className="stage-count">{item.count}</span>
                        </div>
                        <div className="funnel-bar-container">
                          <div 
                            className="funnel-bar" 
                            style={{ 
                              width: `${getFunnelPercentage(item.count)}%`,
                              background: `linear-gradient(90deg, 
                                ${index === 0 ? '#3b82f6' : index === 1 ? '#8b5cf6' : index === 2 ? '#10b981' : '#f59e0b'} 0%, 
                                ${index === 0 ? '#2563eb' : index === 1 ? '#7c3aed' : index === 2 ? '#059669' : '#d97706'} 100%)`
                            }}
                          >
                            <div className="funnel-bar-shine"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment Performance */}
              {performance.length > 0 && (
                <div className="analytics-card">
                  <div className="card-header">
                    <h3 className="card-title">
                      <span className="title-icon">🎯</span>
                      Assessment Performance
                    </h3>
                  </div>
                  <div className="performance-chart">
                    {performance.map((item) => (
                      <div key={item.title} className="performance-item">
                        <div className="performance-header">
                          <span className="performance-title">{item.title}</span>
                          <span 
                            className="performance-score" 
                            style={{ color: getScoreColor(item.average_score) }}
                          >
                            {formatScore(item.average_score)}
                          </span>
                        </div>
                        <div className="performance-bar-container">
                          <div 
                            className="performance-bar" 
                            style={{ 
                              width: `${item.average_score}%`,
                              backgroundColor: getScoreColor(item.average_score)
                            }}
                          >
                            <div className="performance-bar-glow"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="leaderboard-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <span className="title-icon">🏆</span>
                    Top Performers
                  </h2>
                </div>
                <div className="leaderboard-card">
                  <div className="leaderboard-table">
                    <div className="table-header">
                      <div className="th th-rank">Rank</div>
                      <div className="th th-candidate">Candidate</div>
                      <div className="th th-assessment">Assessment</div>
                      <div className="th th-score">Score</div>
                      <div className="th th-status">Status</div>
                    </div>
                    {leaderboard.slice(0, 10).map((entry) => (
                      <div key={entry.rank} className={`table-row ${entry.rank <= 3 ? 'top-performer' : ''}`}>
                        <div className="td td-rank">
                          {entry.rank <= 3 ? (
                            <div className={`rank-badge rank-${entry.rank}`}>
                              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                            </div>
                          ) : (
                            <span className="rank-number">#{entry.rank}</span>
                          )}
                        </div>
                        <div className="td td-candidate">
                          <div className="candidate-info">
                            <div className="candidate-avatar">
                              {entry.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="candidate-name">{entry.name}</div>
                              <div className="candidate-email">{entry.email}</div>
                            </div>
                          </div>
                        </div>
                        <div className="td td-assessment">{entry.assessment_title}</div>
                        <div className="td td-score">
                          <div className="score-badge" style={{ backgroundColor: `${getScoreColor(entry.stack_rank_score)}20`, color: getScoreColor(entry.stack_rank_score) }}>
                            {entry.stack_rank_score}
                          </div>
                        </div>
                        <div className="td td-status">
                          <span className={`status-badge ${getStatusBadgeClass(entry.status)}`}>
                            {getStatusText(entry.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Assessments Grid */}
            <div className="assessments-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="title-icon">📚</span>
                  All Assessments
                </h2>
                <Link href="/admin/assessments/new" className="btn btn-secondary btn-sm">
                  <span className="btn-icon">+</span>
                  New
                </Link>
              </div>

              {assessments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3 className="empty-title">No Assessments Yet</h3>
                  <p className="empty-text">Create your first assessment to get started</p>
                  <Link href="/admin/assessments/new" className="btn btn-primary mt-lg">
                    Create Assessment
                  </Link>
                </div>
              ) : (
                <div className="assessments-grid">
                  {assessments.map((assessment) => (
                    <Link 
                      key={assessment.id} 
                      href={`/admin/assessments/${assessment.id}`}
                      className="assessment-card"
                    >
                      <div className="assessment-badge">
                        <span className={`badge ${assessment.is_active ? 'badge-success' : 'badge-neutral'}`}>
                          {assessment.is_active ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                      <h3 className="assessment-title">{assessment.title}</h3>
                      <p className="assessment-description">
                        {assessment.description || 'No description provided'}
                      </p>
                      <div className="assessment-footer">
                        <span className="footer-item">
                          <span className="footer-icon">📅</span>
                          {formatDate(assessment.created_at)}
                        </span>
                        <span className="footer-item footer-time">
                          {formatRelativeTime(assessment.created_at)}
                        </span>
                      </div>
                      <div className="card-hover-effect"></div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #fafafa;
          padding: var(--spacing-3xl) 0;
        }

        .container {
          max-width: 1400px;
        }

        /* Header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-3xl);
          padding-bottom: var(--spacing-2xl);
          border-bottom: 1px solid #e5e5e5;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .header-icon {
          display: none;
        }

        .gradient-text {
          font-size: 2.25rem;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .header-subtitle {
          color: #86868b;
          font-size: 1rem;
          margin: 0;
          font-weight: 400;
        }

        .btn-glow {
          box-shadow: none;
          background: #0071e3;
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-glow:hover {
          background: #0077ed;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3);
        }

        .btn-icon {
          font-size: 1rem;
          margin-right: var(--spacing-xs);
          font-weight: 400;
        }

        /* Loading State */
        .loading-state {
          text-align: center;
          padding: var(--spacing-3xl);
        }

        .spinner-modern {
          width: 40px;
          height: 40px;
          border: 2px solid #f5f5f7;
          border-top-color: #0071e3;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto var(--spacing-lg);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: #1d1d1f;
          font-size: 1rem;
          font-weight: 400;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: var(--spacing-3xl);
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-lg);
          border: 1px solid #e5e5e5;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          display: none;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          border-color: #d1d1d6;
        }

        .stat-card-primary,
        .stat-card-success,
        .stat-card-info,
        .stat-card-warning {
          --accent-color: #0071e3;
        }

        .stat-icon {
          font-size: 1.75rem;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f7;
          border-radius: 12px;
          color: #0071e3;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 4px;
          letter-spacing: -1px;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #86868b;
          font-weight: 400;
        }

        .stat-trend {
          display: none;
        }

        /* Analytics Grid */
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 20px;
          margin-bottom: var(--spacing-3xl);
        }

        .analytics-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          border: 1px solid #e5e5e5;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .analytics-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          border-color: #d1d1d6;
        }

        .card-header {
          margin-bottom: 32px;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1d1d1f;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin: 0;
          letter-spacing: -0.3px;
        }

        .title-icon {
          display: none;
        }

        /* Funnel Chart */
        .funnel-chart {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .funnel-stage {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .funnel-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .stage-name {
          font-weight: 500;
          color: #1d1d1f;
        }

        .stage-count {
          font-weight: 600;
          color: #0071e3;
          font-size: 1rem;
        }

        .funnel-bar-container {
          height: 8px;
          background: #f5f5f7;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .funnel-bar {
          height: 100%;
          background: #0071e3;
          border-radius: 8px;
          position: relative;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .funnel-bar-shine {
          display: none;
        }

        /* Performance Chart */
        .performance-chart {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .performance-item {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .performance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .performance-title {
          font-weight: 500;
          color: #1d1d1f;
          font-size: 0.9rem;
        }

        .performance-score {
          font-weight: 600;
          font-size: 1rem;
          color: #0071e3;
        }

        .performance-bar-container {
          height: 8px;
          background: #f5f5f7;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .performance-bar {
          height: 100%;
          border-radius: 8px;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
          background: #0071e3;
        }

        .performance-bar-glow {
          display: none;
        }

        /* Leaderboard Section */
        .leaderboard-section {
          margin-bottom: var(--spacing-3xl);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1d1d1f;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin: 0;
          letter-spacing: -0.4px;
        }

        .leaderboard-card {
          background: white;
          border-radius: 16px;
          padding: 0;
          border: 1px solid #e5e5e5;
          overflow: hidden;
        }

        .leaderboard-table {
          display: flex;
          flex-direction: column;
        }

        .table-header {
          display: grid;
          grid-template-columns: 60px 2fr 2fr 100px 120px;
          gap: var(--spacing-md);
          padding: 20px 32px;
          background: #fafafa;
          font-weight: 500;
          font-size: 0.8rem;
          color: #86868b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e5e5;
        }

        .table-row {
          display: grid;
          grid-template-columns: 60px 2fr 2fr 100px 120px;
          gap: var(--spacing-md);
          padding: 20px 32px;
          transition: background 0.2s ease;
          align-items: center;
          border-bottom: 1px solid #f5f5f7;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row:hover {
          background: #fafafa;
        }

        .top-performer {
          background: #fff;
          border: none;
        }

        .top-performer:hover {
          background: #fafafa;
        }

        .rank-badge {
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rank-number {
          font-weight: 500;
          color: #86868b;
          font-size: 1rem;
        }

        .candidate-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .candidate-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0071e3, #00a8ff);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .candidate-name {
          font-weight: 500;
          color: #1d1d1f;
          font-size: 0.9rem;
        }

        .candidate-email {
          font-size: 0.8rem;
          color: #86868b;
          margin-top: 2px;
        }

        .score-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          background: #f5f5f7;
          color: #0071e3;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: capitalize;
          background: #f5f5f7;
          color: #1d1d1f;
        }

        /* Assessments Section */
        .assessments-section {
          margin-bottom: var(--spacing-2xl);
        }

        .assessments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }

        .assessment-card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          text-decoration: none;
          display: block;
          position: relative;
          overflow: hidden;
          border: 1px solid #e5e5e5;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .assessment-card::before {
          display: none;
        }

        .assessment-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          border-color: #d1d1d6;
        }

        .card-hover-effect {
          display: none;
        }

        .assessment-badge {
          margin-bottom: 16px;
        }

        .assessment-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 12px 0;
          letter-spacing: -0.3px;
        }

        .assessment-description {
          color: #86868b;
          line-height: 1.5;
          margin-bottom: 20px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 0.9rem;
        }

        .assessment-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #f5f5f7;
          font-size: 0.8rem;
        }

        .footer-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #86868b;
        }

        .footer-icon {
          font-size: 0.9rem;
        }

        .footer-time {
          font-weight: 500;
          color: #0071e3;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--spacing-3xl);
          background: white;
          border-radius: 16px;
          border: 1px solid #e5e5e5;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: var(--spacing-lg);
          opacity: 0.5;
        }

        .empty-title {
          font-size: 1.5rem;
          margin-bottom: var(--spacing-xs);
          color: #1d1d1f;
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        .empty-text {
          color: #86868b;
          margin-bottom: var(--spacing-xl);
          font-size: 0.9rem;
        }

        /* Alert */
        .alert {
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          border: 1px solid #e5e5e5;
        }

        .alert-error {
          background: #fff5f5;
          color: #dc2626;
          border-color: #fecaca;
        }

        .alert-icon {
          font-size: 1.1rem;
        }

        /* Badge Styles */
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          gap: 6px;
        }

        .badge-success {
          background: #f0fdf4;
          color: #16a34a;
        }

        .badge-neutral {
          background: #f5f5f7;
          color: #86868b;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .gradient-text {
            font-size: 1.75rem;
          }

          .header-content {
            gap: var(--spacing-xs);
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .assessments-grid {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 50px 1fr 80px;
            font-size: 0.75rem;
            padding: 16px 20px;
          }

          .th-assessment,
          .td-assessment,
          .th-status,
          .td-status {
            display: none;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
          }

          .section-title {
            font-size: 1.25rem;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .analytics-card {
            padding: 24px;
          }

          .card-title {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
}