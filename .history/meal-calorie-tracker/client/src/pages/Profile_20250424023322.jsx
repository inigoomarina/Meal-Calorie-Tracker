import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  return (
    <div className="profile-container">
      <h1>User Profile</h1>
      
      <div className="card">
        <div className="profile-info">
          <h2>Personal Information</h2>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
        </div>
        
        <div className="profile-section">
          <h2>Account Details</h2>
          <p>This is a placeholder for the user profile page. Additional account management features will be available in future updates.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
