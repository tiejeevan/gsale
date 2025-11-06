import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import LikeButton from "./LikeButton";
import CommentsSection, { type Comment } from "./Comments/CommentsSection";

interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  username?: string;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  is_edited: boolean;
  liked_by_user: boolean;
  attachments?: Attachment[];
  comments?: Comment[];
}

interface PostCardProps {
  post: Post;
  userId?: number;
  currentUserId?: number;
  token: string;
  showUsername?: boolean;
  showEditDeleteOnHover?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  r2PublicUrl?: string;
}

const R2_PUBLIC_URL = "https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev";

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  token,
  showUsername = true,
  showEditDeleteOnHover = true,
  onEdit,
  onDelete,
}) => {
  const [hovered, setHovered] = useState(false);

  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split("/").pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  const canEdit = post.user_id === currentUserId;

  return (
    <div
      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all relative border border-gray-200 dark:border-gray-700 flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* User Info */}
      {showUsername && post.username && (
        <div className="flex items-center space-x-4 mb-4">
          <Link 
            to={`/profile/${post.user_id}`}
            className="flex items-center space-x-4 hover:opacity-80 transition-opacity group"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              {post.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {post.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Content */}
      <p className="text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-line mb-4">
        {post.content}
      </p>

      {/* Image */}
      {post.image_url && (
        <img
          src={getPublicUrl(post.image_url)}
          alt="Post"
          className="rounded-xl w-full max-h-80 object-cover shadow-lg border border-gray-200 dark:border-gray-700 mb-4 transition-transform hover:scale-105"
        />
      )}

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {post.attachments.map((att) => {
            const fileUrl = getPublicUrl(att.file_url);
            const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(att.file_name);
            return isImage ? (
              <img
                key={att.id}
                src={fileUrl}
                alt={att.file_name}
                className="rounded-lg max-h-48 w-auto object-cover border border-gray-300 dark:border-gray-600 hover:shadow-xl cursor-pointer transition-all"
                onClick={() => window.open(fileUrl, "_blank")}
              />
            ) : (
              <a
                key={att.id}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-indigo-100 dark:bg-indigo-700 text-indigo-800 dark:text-white rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-600 transition-colors"
              >
                {att.file_name}
              </a>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-2 mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {post.is_edited && <span>Edited • </span>}
          {new Date(post.created_at).toLocaleString()}
        </div>
        <LikeButton
          targetType="post"
          targetId={post.id}
          initialLikesCount={post.like_count}
          isInitiallyLiked={post.liked_by_user}
          token={token}
        />
      </div>

      {/* Edit/Delete */}
      {canEdit && (
        <div
          className={`absolute top-4 right-4 flex space-x-2 transition-opacity ${
            showEditDeleteOnHover ? (hovered ? "opacity-100" : "opacity-0") : "opacity-100"
          }`}
        >
          {onEdit && (
            <button
              onClick={() => onEdit(post)}
              className="text-indigo-500 hover:text-indigo-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FiEdit2 size={20} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(post)}
              className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FiTrash2 size={20} />
            </button>
          )}
        </div>
      )}

      {/* Comments Section */}
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <CommentsSection
          postId={post.id}
          currentUserId={currentUserId}
          initialComments={post.comments} 
          className="sticky bottom-0 w-full"
        />
      </div>
    </div>
  );
};

export default PostCard;
