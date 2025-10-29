import React from "react";

interface EditPostModalProps {
  isOpen: boolean;
  content: string;
  imageUrl: string;
  onClose: () => void;
  onSave: (updatedContent: string, updatedImage: string) => void;
  onChangeContent: (value: string) => void;
  onChangeImage: (value: string) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  content,
  imageUrl,
  onClose,
  onSave,
  onChangeContent,
  onChangeImage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Edit Post</h3>
        <textarea
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-gray-100 mb-3"
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
        />
        <input
          type="text"
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-gray-100 mb-3"
          placeholder="Image URL (optional)"
          value={imageUrl}
          onChange={(e) => onChangeImage(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
            onClick={() => onSave(content, imageUrl)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
