import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiEdit2, FiSettings, FiMapPin, FiLink, FiCalendar, FiMail, FiPhone, FiSave, FiX, FiPlus } from "react-icons/fi";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useUserContext } from "../context/UserContext";
import { userService, type User } from "../services/userService";
import EditProfileModal from "../components/EditProfileModal.tsx";
import DeactivateAccountModal from "../components/DeactivateAccountModal.tsx";

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser, isAuthenticated, updateUser } = useUserContext();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  
  // Inline editing state
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});

  // Check if viewing own profile
  const isOwnProfile = !userId || (!!currentUser && userId === currentUser.id.toString());

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (isOwnProfile && currentUser) {
          setProfileUser(currentUser);
        } else if (userId) {
          const user = await userService.getPublicProfile(parseInt(userId));
          setProfileUser(user);
        } else {
          setError("Profile not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser, isOwnProfile]);

  const handleProfileUpdate = (updatedUser: User) => setProfileUser(updatedUser);

  // Inline editing functions
  const startEditing = (field: string, currentValue: string = '') => {
    setEditingFields(prev => ({ ...prev, [field]: true }));
    setEditValues(prev => ({ ...prev, [field]: currentValue }));
  };

  const cancelEditing = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: false }));
    setEditValues(prev => {
      const newValues = { ...prev };
      delete newValues[field];
      return newValues;
    });
  };

  const saveField = async (field: string) => {
    if (!profileUser || !editValues[field]?.trim()) return;
    
    setSavingFields(prev => ({ ...prev, [field]: true }));
    
    try {
      let updateData: any = {};
      
      // Handle social links separately
      if (field.startsWith('social_')) {
        const platform = field.replace('social_', '');
        updateData = {
          social_links: {
            ...profileUser.social_links,
            [platform]: editValues[field].trim()
          }
        };
      } else {
        updateData[field] = editValues[field].trim();
      }
      
      await updateUser(updateData);
      
      // Update local state
      const updatedUser = { ...profileUser, ...updateData };
      setProfileUser(updatedUser);
      
      // Clear editing state
      cancelEditing(field);
    } catch (error) {
      console.error('Failed to update field:', error);
    } finally {
      setSavingFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const isFieldEmpty = (value: any) => {
    return !value || (typeof value === 'string' && value.trim() === '');
  };

  // Inline edit component
  const InlineEditField: React.FC<{
    field: string;
    value: string;
    placeholder: string;
    icon: React.ReactNode;
    type?: 'text' | 'url' | 'email' | 'tel';
    multiline?: boolean;
  }> = ({ field, value, placeholder, icon, type = 'text', multiline = false }) => {
    const isEditing = editingFields[field];
    const isSaving = savingFields[field];
    const isEmpty = isFieldEmpty(value);

    if (!isOwnProfile && isEmpty) return null;

    return (
      <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300 group py-2">
        <div className="mt-1">{icon}</div>
        {isEditing ? (
          <div className="flex-1 flex items-start gap-2">
            {multiline ? (
              <input
                type="text"
                value={editValues[field] || ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                autoFocus
                dir="ltr"
              />
            ) : (
              <input
                type={type}
                value={editValues[field] || ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
                dir="ltr"
              />
            )}
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => saveField(field)}
                disabled={isSaving || !editValues[field]?.trim()}
                className="p-2 text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <FiSave size={16} />
              </button>
              <button
                onClick={() => cancelEditing(field)}
                disabled={isSaving}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            {isEmpty ? (
              isOwnProfile && (
                <button
                  onClick={() => startEditing(field)}
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  <FiPlus size={16} />
                  <span>Add {placeholder.toLowerCase()}</span>
                </button>
              )
            ) : (
              <>
                {type === 'url' ? (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  <span>{value}</span>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => startEditing(field, value)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all rounded"
                  >
                    <FiEdit2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Dedicated Bio/About components with proper text direction
  const BioField: React.FC = () => {
    const isEditing = editingFields['bio'];
    const isSaving = savingFields['bio'];
    const isEmpty = isFieldEmpty(profileUser?.bio);

    if (isEditing) {
      return (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Bio</h3>
          <div className="flex gap-2">
            <input
            type="text"
              value={editValues['bio'] || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell people about yourself..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              autoFocus
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={() => saveField('bio')}
                disabled={isSaving || !editValues['bio']?.trim()}
                className="p-2 text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <FiSave size={18} />
              </button>
              <button
                onClick={() => cancelEditing('bio')}
                disabled={isSaving}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isEmpty && isOwnProfile) {
      return (
        <div className="mb-8">
          <button
            onClick={() => startEditing('bio')}
            className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
          >
            <FiPlus size={20} />
            <span>Add a bio</span>
          </button>
        </div>
      );
    }

    if (!isEmpty) {
      return (
        <div className="mb-8 group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bio</h3>
            {isOwnProfile && (
              <button
                onClick={() => startEditing('bio', profileUser?.bio || '')}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all rounded"
              >
                <FiEdit2 size={16} />
              </button>
            )}
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            {profileUser?.bio}
          </p>
        </div>
      );
    }

    return null;
  };

  const AboutField: React.FC = () => {
    const isEditing = editingFields['about'];
    const isSaving = savingFields['about'];
    const isEmpty = isFieldEmpty(profileUser?.about);

    if (isEditing) {
      return (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About</h3>
          <div className="flex gap-2">
            <input
            type="text"
              value={editValues['about'] || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, about: e.target.value }))}
              placeholder="Write a longer description about yourself, your interests, experience, etc..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              autoFocus
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={() => saveField('about')}
                disabled={isSaving || !editValues['about']?.trim()}
                className="p-2 text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <FiSave size={18} />
              </button>
              <button
                onClick={() => cancelEditing('about')}
                disabled={isSaving}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isEmpty && isOwnProfile) {
      return (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About</h3>
          <button
            onClick={() => startEditing('about')}
            className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
          >
            <FiPlus size={20} />
            <span>Add about section</span>
          </button>
        </div>
      );
    }

    if (!isEmpty) {
      return (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">About</h3>
            {isOwnProfile && (
              <button
                onClick={() => startEditing('about', profileUser?.about || '')}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all rounded"
              >
                <FiEdit2 size={16} />
              </button>
            )}
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {profileUser?.about}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-xl text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-300">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Cover Image */}
        <div className="relative h-64 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl overflow-hidden">
          {profileUser.cover_image ? (
            <img
              src={profileUser.cover_image}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500" />
          )}
          
          {/* Action Buttons */}
          {isOwnProfile && isAuthenticated && (
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all"
              >
                <FiEdit2 size={20} />
              </button>
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-full shadow-lg transition-all"
              >
                <FiSettings size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-xl p-8 -mt-16 relative z-10">
          {/* Profile Image & Basic Info */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
            <div className="relative">
              <img
                src={profileUser.profile_image || `https://ui-avatars.com/api/?name=${profileUser.display_name || profileUser.username}&size=128&background=6366f1&color=ffffff`}
                alt={profileUser.display_name || profileUser.username}
                className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-700 shadow-lg"
              />
              {profileUser.is_verified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {profileUser.display_name || profileUser.username}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-1">
                @{profileUser.username}
              </p>
              {profileUser.role && (
                <span className="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-medium">
                  {profileUser.role}
                </span>
              )}
            </div>
          </div>

          {/* Bio Section */}
          <BioField />

          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h3>
              
              <InlineEditField
                field="email"
                value={profileUser.email || ''}
                placeholder="Email"
                icon={<FiMail className="text-indigo-500" size={20} />}
                type="email"
              />
              
              <InlineEditField
                field="phone"
                value={profileUser.phone || ''}
                placeholder="Phone"
                icon={<FiPhone className="text-indigo-500" size={20} />}
                type="tel"
              />
              
              <InlineEditField
                field="location"
                value={profileUser.location || ''}
                placeholder="Location"
                icon={<FiMapPin className="text-indigo-500" size={20} />}
              />
              
              <InlineEditField
                field="website"
                value={profileUser.website || ''}
                placeholder="Website"
                icon={<FiLink className="text-indigo-500" size={20} />}
                type="url"
              />
              
              {profileUser.created_at && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 py-2">
                  <FiCalendar className="text-indigo-500" size={20} />
                  <span>Joined {new Date(profileUser.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Social Links
              </h3>
              
              <InlineEditField
                field="social_facebook"
                value={profileUser.social_links?.facebook || ''}
                placeholder="Facebook URL"
                icon={<FaFacebook className="text-blue-600" size={20} />}
                type="url"
              />
              
              <InlineEditField
                field="social_twitter"
                value={profileUser.social_links?.twitter || ''}
                placeholder="Twitter URL"
                icon={<FaTwitter className="text-blue-400" size={20} />}
                type="url"
              />
              
              <InlineEditField
                field="social_instagram"
                value={profileUser.social_links?.instagram || ''}
                placeholder="Instagram URL"
                icon={<FaInstagram className="text-pink-500" size={20} />}
                type="url"
              />
              
              <InlineEditField
                field="social_linkedin"
                value={profileUser.social_links?.linkedin || ''}
                placeholder="LinkedIn URL"
                icon={<FaLinkedin className="text-blue-700" size={20} />}
                type="url"
              />
            </div>
          </div>

          {/* About Section */}
          <AboutField />
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {showDeactivateModal && (
        <DeactivateAccountModal
          onClose={() => setShowDeactivateModal(false)}
        />
      )}
    </div>
  );
};

export default Profile;