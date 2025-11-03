'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isAdmin, signOut } from '../lib/auth';

export default function Navigation() {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAdminUser(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Don't show anything while loading
  if (isLoading) {
    return (
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <Link href="/" className="navbar-brand">
              <span className="brand-icon">⚡</span>
              <span className="brand-name">AfterQuery</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link href="/" className="navbar-brand">
            <span className="brand-icon">⚡</span>
            <span className="brand-name">AfterQuery</span>
          </Link>
          
          <div className="navbar-links">
            {isAdminUser && (
              <>
                <Link 
                  href="/admin" 
                  className={`navbar-link ${pathname?.startsWith('/admin') ? 'active' : ''}`}
                >
                  Admin
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="navbar-link logout-btn"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .navbar-link.active {
          color: var(--color-primary);
          background-color: var(--color-bg-secondary);
        }

        .logout-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
        }
      `}</style>
    </nav>
  );
}

