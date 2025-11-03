'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin, isAuthenticated } from '../lib/auth';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Check if user is authenticated
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        // Redirect to login page
        router.push('/login?redirect=/admin');
        return;
      }

      // Check if user is admin
      const adminStatus = await isAdmin();
      
      if (!adminStatus) {
        // User is authenticated but not admin - redirect to home
        router.push('/');
        return;
      }

      // User is authorized
      setIsAuthorized(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Unauthorized access. Redirecting...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

