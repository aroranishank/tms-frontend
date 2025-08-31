import { useState, useCallback, memo, FormEvent, ChangeEvent, useEffect } from 'react';
import { User, Settings, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
// import { getCurrentUser } from '../../services/apiService';
import type { UserUpdate, User as UserType } from '../../types';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile = memo(({ isOpen, onClose }: UserProfileProps) => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<UserUpdate>({
    username: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && authUser) {
      // Use the user data from auth context since backend doesn't have profile endpoints yet
      setUser(authUser);
      setFormData({
        username: authUser.username,
        email: authUser.email || '',
        password: ''
      });
      setIsLoading(false);
    }
  }, [isOpen, authUser]);

  // const loadUserProfile = async () => {
  //   // Currently not used - backend endpoints don't exist yet
  //   setIsLoading(true);
  //   try {
  //     const userData = await getCurrentUser();
  //     setUser(userData);
  //     setFormData({
  //       username: userData.username,
  //       email: userData.email || '',
  //       password: ''
  //     });
  //   } catch (error) {
  //     console.error('Failed to load user profile:', error);
  //     setError('Failed to load profile data');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Show message that backend doesn't support this yet
    setError('Profile updates are not yet supported by the backend. Please contact your administrator.');
    setIsSubmitting(false);
    
    // TODO: Implement when backend has user profile update endpoints
    /*
    try {
      const updateData: UserUpdate = {
        username: formData.username,
        email: formData.email
      };
      
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      const updatedUser = await updateCurrentUser(updateData);
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
      
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
    */
  }, [formData, isSubmitting]);

  const handleClose = useCallback(() => {
    setError('');
    setSuccess('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4 duration-300">
        <div className="relative p-8">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              User Profile
            </h2>
            <p className="text-gray-600">
              View your account information
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-2">
              ⚠️ Profile updates require additional backend endpoints
            </p>
            {user?.is_admin && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                <Settings className="w-3 h-3 mr-1" />
                Administrator
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                  placeholder="Enter your username"
                  required
                  disabled={true}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                  placeholder="Email not available"
                  disabled={true}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                  placeholder="Password updates not available"
                  disabled={true}
                  readOnly
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-in slide-in-from-top-1 duration-300">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl animate-in slide-in-from-top-1 duration-300">
                  <p className="text-sm font-medium">{success}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <span>Close</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
});

UserProfile.displayName = 'UserProfile';

export default UserProfile;