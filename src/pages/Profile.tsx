// src/pages/users/[id].tsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiEdit2, FiSettings, FiMapPin, FiLink, FiCalendar, FiMail, FiPhone } from "react-icons/fi";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useUserContext } from "../context/UserContext";
import { userService, type User } from "../services/userService";
import EditProfileModal from "../components/EditProfileModal";
import DeactivateAccountModal from "../components/DeactivateAccountModal";

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser, isAuthenticated } = useUserContext();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = !userId || (!!currentUser && userId === currentUser.id.toString());

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      console.log("Profile fetch - userId:", userId, "isOwnProfile:", isOwnProfile, "currentUser:", !!currentUser);
      
      try {
        if (isOwnProfile && currentUser) {
          console.log("Loading own profile from currentUser");
          setProfileUser(currentUser);
        } else if (userId) {
          console.log("Fetching public profile for userId:", userId);
          const user = await userService.getPublicProfile(parseInt(userId));
          setProfileUser(user);
        } else {
          console.log("No userId and not own profile - this shouldn't happen");
        }
      } catch (err: any) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser, isOwnProfile]);

  const handleProfileUpdate = (updatedUser: User) => setProfileUser(updatedUser);

  if (loading) return <LoadingScreen message="Loading profile..." />;
  if (error) return <ErrorScreen message={error} />;
  if (!profileUser) return <ErrorScreen message="Profile not found" />;

  const socialIcons = { facebook: FaFacebook, twitter: FaTwitter, instagram: FaInstagram, linkedin: FaLinkedin };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CoverSection
          coverImage={profileUser.cover_image}
          isOwnProfile={isOwnProfile && isAuthenticated}
          onEdit={() => setShowEditModal(true)}
          onDeactivate={() => setShowDeactivateModal(true)}
        />

        <ProfileCard
          user={profileUser}
          socialIcons={socialIcons}
        />
      </div>

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

// -------------------- COMPONENTS --------------------

const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-xl text-gray-600 dark:text-gray-300">{message}</div>
  </div>
);

const ErrorScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-xl text-red-600 dark:text-red-400">{message}</div>
  </div>
);

interface CoverSectionProps {
  coverImage?: string;
  isOwnProfile: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
}

const CoverSection: React.FC<CoverSectionProps> = ({ coverImage, isOwnProfile, onEdit, onDeactivate }) => (
  <div className="relative h-64 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl overflow-hidden">
    {coverImage ? (
      <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500" />
    )}
    {isOwnProfile && (
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={onEdit} className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all">
          <FiEdit2 size={20} />
        </button>
        <button onClick={onDeactivate} className="bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-full shadow-lg transition-all">
          <FiSettings size={20} />
        </button>
      </div>
    )}
  </div>
);

interface ProfileCardProps {
  user: User;
  socialIcons: Record<string, React.FC<any>>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, socialIcons }) => (
  <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-xl p-8 -mt-16 relative z-10">
    {/* Profile Image & Info */}
    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
      <div className="relative">
        <img
          src={user.profile_image || `https://ui-avatars.com/api/?name=${user.display_name}&size=128&background=6366f1&color=ffffff`}
          alt={user.display_name}
          className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-700 shadow-lg"
        />
        {user.is_verified && (
          <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <div className="text-center md:text-left flex-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{user.display_name}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-1">@{user.username}</p>
        {user.role && (
          <span className="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-medium">
            {user.role}
          </span>
        )}
      </div>
    </div>

    {/* Bio */}
    {user.bio && <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-8">{user.bio}</p>}

    {/* Contact Info */}
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
        {user.email && <InfoRow icon={FiMail} text={user.email} />}
        {user.phone && <InfoRow icon={FiPhone} text={user.phone} />}
        {user.location && <InfoRow icon={FiMapPin} text={user.location} />}
        {user.website && <InfoRow icon={FiLink} text={<a href={user.website} target="_blank" rel="noopener noreferrer">{user.website}</a>} />}
        {user.created_at && <InfoRow icon={FiCalendar} text={`Joined ${new Date(user.created_at).toLocaleDateString()}`} />}
      </div>

      {/* Social Links */}
      {user.social_links && Object.keys(user.social_links).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(user.social_links).map(([platform, url]) => {
              if (!url) return null;
              const IconComponent = socialIcons[platform];
              if (!IconComponent) return null;
              return (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
                  <IconComponent size={20} />
                  <span className="capitalize">{platform}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* About Section */}
    {user.about && (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About</h3>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{user.about}</p>
        </div>
      </div>
    )}
  </div>
);

interface InfoRowProps {
  icon: React.FC<any>;
  text: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
    <Icon className="text-indigo-500" size={20} />
    <span>{text}</span>
  </div>
);
