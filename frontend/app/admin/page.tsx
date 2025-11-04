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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: var(--spacing-2xl) 0;
          position: relative;
        }

        .admin-dashboard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(138, 92, 246, 0.3), transparent 50%);
          pointer-events: none;
        }

        .container {
          position: relative;
          z-index: 1;
        }

        /* Header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-2xl);
          flex-wrap: wrap;
          gap: var(--spacing-lg);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .header-icon {
          font-size: 3rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .gradient-text {
          background: linear-gradient(135deg, #ffffff 0%, #f0f0ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0;
          margin-bottom: var(--spacing-xs);
        }

        .header-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
          margin: 0;
        }

        .btn-glow {
          box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4);
          position: relative;
          overflow: hidden;
        }

        .btn-glow::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        .btn-glow:hover::before {
          left: 100%;
        }

        .btn-icon {
          font-size: 1.2rem;
          margin-right: var(--spacing-xs);
        }

        /* Loading State */
        .loading-state {
          text-align: center;
          padding: var(--spacing-3xl);
        }

        .spinner-modern {
          width: 60px;
          height: 60px;
          border: 5px solid rgba(255, 255, 255, 0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto var(--spacing-lg);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: white;
          font-size: 1.1rem;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
        }

        .stat-card {
          background: white;
          border-radius: 20px;
          padding: var(--spacing-xl);
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--accent-color, #3b82f6), var(--accent-color-dark, #2563eb));
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .stat-card-primary {
          --accent-color: #3b82f6;
          --accent-color-dark: #2563eb;
        }

        .stat-card-success {
          --accent-color: #10b981;
          --accent-color-dark: #059669;
        }

        .stat-card-info {
          --accent-color: #8b5cf6;
          --accent-color-dark: #7c3aed;
        }

        .stat-card-warning {
          --accent-color: #f59e0b;
          --accent-color-dark: #d97706;
        }

        .stat-icon {
          font-size: 2.5rem;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--accent-color), var(--accent-color-dark));
          border-radius: 15px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--spacing-xs);
        }

        .stat-label {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .stat-trend {
          font-size: 0.75rem;
          padding: 4px 10px;
          background: var(--accent-color);
          color: white;
          border-radius: 12px;
          font-weight: 600;
        }

        /* Analytics Grid */
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
        }

        .analytics-card {
          background: white;
          border-radius: 20px;
          padding: var(--spacing-xl);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .analytics-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          margin-bottom: var(--spacing-xl);
        }

        .card-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin: 0;
        }

        .title-icon {
          font-size: 1.5rem;
        }

        /* Funnel Chart */
        .funnel-chart {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .funnel-stage {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .funnel-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
        }

        .stage-name {
          font-weight: 600;
          color: var(--color-text);
        }

        .stage-count {
          font-weight: 700;
          color: var(--color-primary);
        }

        .funnel-bar-container {
          height: 40px;
          background: #f3f4f6;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }

        .funnel-bar {
          height: 100%;
          border-radius: 12px;
          position: relative;
          transition: width 1s ease-out;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .funnel-bar-shine {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), transparent);
          border-radius: 12px 12px 0 0;
        }

        /* Performance Chart */
        .performance-chart {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .performance-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .performance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .performance-title {
          font-weight: 600;
          color: var(--color-text);
          font-size: 0.95rem;
        }

        .performance-score {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .performance-bar-container {
          height: 12px;
          background: #f3f4f6;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .performance-bar {
          height: 100%;
          border-radius: 8px;
          transition: width 1s ease-out;
          position: relative;
        }

        .performance-bar-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }

        /* Leaderboard Section */
        .leaderboard-section {
          margin-bottom: var(--spacing-2xl);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin: 0;
        }

        .leaderboard-card {
          background: white;
          border-radius: 20px;
          padding: var(--spacing-xl);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .leaderboard-table {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .table-header {
          display: grid;
          grid-template-columns: 80px 2fr 2fr 100px 120px;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: #f9fafb;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .table-row {
          display: grid;
          grid-template-columns: 80px 2fr 2fr 100px 120px;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          border-radius: 12px;
          transition: all 0.2s ease;
          align-items: center;
        }

        .table-row:hover {
          background: #f9fafb;
        }

        .top-performer {
          background: linear-gradient(90deg, #fef3c7, #fef9e7);
          border: 2px solid #fbbf24;
        }

        .top-performer:hover {
          background: linear-gradient(90deg, #fef3c7, #fff7db);
        }

        .rank-badge {
          font-size: 1.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rank-number {
          font-weight: 700;
          color: var(--color-text-secondary);
          font-size: 1.1rem;
        }

        .candidate-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .candidate-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .candidate-name {
          font-weight: 600;
          color: var(--color-text);
          font-size: 0.95rem;
        }

        .candidate-email {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
        }

        .score-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        /* Assessments Section */
        .assessments-section {
          margin-bottom: var(--spacing-2xl);
        }

        .assessments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-lg);
        }

        .assessment-card {
          background: white;
          border-radius: 20px;
          padding: var(--spacing-xl);
          text-decoration: none;
          display: block;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .assessment-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .assessment-card:hover::before {
          transform: scaleX(1);
        }

        .assessment-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }

        .card-hover-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(102, 126, 234, 0.1), transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .assessment-card:hover .card-hover-effect {
          opacity: 1;
        }

        .assessment-badge {
          margin-bottom: var(--spacing-md);
        }

        .assessment-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 var(--spacing-md) 0;
        }

        .assessment-description {
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: var(--spacing-lg);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .assessment-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border);
          font-size: 0.85rem;
        }

        .footer-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--color-text-secondary);
        }

        .footer-icon {
          font-size: 1rem;
        }

        .footer-time {
          font-weight: 600;
          color: var(--color-primary);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--spacing-3xl);
          background: white;
          border-radius: 20px;
          border: 2px dashed var(--color-border);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-lg);
        }

        .empty-title {
          font-size: 1.5rem;
          margin-bottom: var(--spacing-sm);
          color: var(--color-text);
        }

        .empty-text {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xl);
        }

        /* Alert */
        .alert {
          padding: var(--spacing-md);
          border-radius: 12px;
          margin-bottom: var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .alert-error {
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .alert-icon {
          font-size: 1.2rem;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .gradient-text {
            font-size: 2rem;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .assessments-grid {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 60px 1fr 80px;
            font-size: 0.8rem;
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
        }
      `}</style>
    </div>
  );
}