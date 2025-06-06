import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [profileData, setProfileData] = useState<{ username: string; id: number } | null>(null);

  useEffect(() => {
    const getProfile = () => {
      if (isAuthenticated && user) {
        setProfileData(user);
      }
    };
    if (!loading) getProfile();
  }, [isAuthenticated, user, loading]);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!isAuthenticated) {
    return <div>You are not authenticated. Please log in.</div>;
  }

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      {profileData ? (
        <div className="profile-details">
          <p><strong>Username:</strong> {profileData.username}</p>
          <p><strong>User ID:</strong> {profileData.id}</p>
        </div>
      ) : (
        <p>No profile data available.</p>
      )}
    </div>
  );
};

export default ProfilePage;