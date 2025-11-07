import React, { useState } from "react";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import GroupIcon from "@mui/icons-material/Group";
import { useUserContext } from "../context/UserContext";
import { FiImage, FiLoader, FiSend } from "react-icons/fi";
import { triggerPostCreated } from "../utils/eventBus";
import { createPost as createPostService } from "../services/postService";

const CreatePost: React.FC = () => {
  const { token, currentUser: user } = useUserContext();

  if (!user) return null;

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "follows">("public");
  const [visibilityAnchorEl, setVisibilityAnchorEl] = useState<null | HTMLElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const openVisibilityMenu = (e: React.MouseEvent<HTMLElement>) => setVisibilityAnchorEl(e.currentTarget);
  const closeVisibilityMenu = () => setVisibilityAnchorEl(null);
  const selectVisibility = (value: "public" | "private" | "follows") => {
    setVisibility(value);
    closeVisibilityMenu();
  };

  const renderVisibilityIcon = (size: "small" | "medium" = "small") => {
    if (visibility === "private") return <LockIcon fontSize={size} />;
    if (visibility === "follows") return <GroupIcon fontSize={size} />;
    return <PublicIcon fontSize={size} />;
  };
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  };

  const createPost = async () => {
    if (!content.trim() && files.length === 0) {
      setMessage("Write something or attach files to post.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await createPostService(token!, {
        content,
        title: title || undefined,
        visibility,
        files,
        comments_enabled: true,
      });

      setMessage("✅ Post created successfully!");
      setContent("");
      setTitle("");
      setFiles([]);
      setShowAdvanced(false);
      triggerPostCreated(); // ✅ Notify UserPosts to refresh
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "⚠️ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && (content.trim() || files.length > 0)) {
        createPost();
      }
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
        Welcome {user?.first_name || user?.username || 'User'}
      </h2>
      {message && (
        <div className={`mb-3 text-sm ${
          message.startsWith("✅") ? "text-green-600" :
          message.startsWith("❌") ? "text-red-500" : "text-yellow-600"
        }`}>{message}</div>
      )}

      {/* Title Input (Optional) */}
      {showAdvanced && (
        <div className="mb-3">
          <input
            type="text"
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Post title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      )}

      <div className="relative mb-4">
        <textarea
          className="w-full p-3 pr-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[100px]"
          placeholder="What's on your mind? (Press Enter to post, Shift+Enter for new line)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="absolute bottom-2 right-2">
          <Tooltip title={visibility === "public" ? "Public" : visibility === "follows" ? "Follows" : "Private"} arrow>
            <IconButton size="small" onClick={openVisibilityMenu} sx={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
              {renderVisibilityIcon("small")}
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={visibilityAnchorEl}
            open={Boolean(visibilityAnchorEl)}
            onClose={closeVisibilityMenu}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <MenuItem onClick={() => selectVisibility("public")}>
              <Tooltip title="Public" placement="left" arrow>
                <div className="flex items-center gap-2">
                  <PublicIcon fontSize="small" />
                  <span className="text-sm">Public</span>
                </div>
              </Tooltip>
            </MenuItem>
            <MenuItem onClick={() => selectVisibility("follows")}>
              <Tooltip title="Follows" placement="left" arrow>
                <div className="flex items-center gap-2">
                  <GroupIcon fontSize="small" />
                  <span className="text-sm">Follows</span>
                </div>
              </Tooltip>
            </MenuItem>
            <MenuItem onClick={() => selectVisibility("private")}>
              <Tooltip title="Private" placement="left" arrow>
                <div className="flex items-center gap-2">
                  <LockIcon fontSize="small" />
                  <span className="text-sm">Private</span>
                </div>
              </Tooltip>
            </MenuItem>
          </Menu>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <label 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#e0e7ff',
              color: '#3730a3',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              border: 'none',
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#c7d2fe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e7ff';
            }}
          >
            <FiImage style={{ fontSize: '16px' }} /> 
            <span>Attach Files</span>
            <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
          </label>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              padding: '8px 16px',
              backgroundColor: showAdvanced ? '#c7d2fe' : '#f3f4f6',
              color: showAdvanced ? '#3730a3' : '#6b7280',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              border: 'none',
            }}
          >
            {showAdvanced ? 'Less' : 'More'}
          </button>
        </div>

        <button
          onClick={createPost}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#a5b4fc' : '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '8px 20px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: loading ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            WebkitAppearance: 'none',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#3730a3';
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#4f46e5';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {loading ? <><FiLoader className="animate-spin" /> Posting...</> : <><FiSend /> Post</>}
        </button>
      </div>

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file, idx) => {
            const url = URL.createObjectURL(file);
            if (file.type.startsWith("image/")) {
              return <img key={idx} src={url} alt={file.name} className="rounded-xl object-cover h-32 w-full border border-gray-300 dark:border-gray-600" />;
            } else {
              return <div key={idx} className="flex items-center justify-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl p-3">📄 {file.name}</div>;
            }
          })}
        </div>
      )}
    </div>
  );
};

export default CreatePost;
