// eventBus.ts
import type { Post } from "../services/postService";

type Callback = (post: Post) => void;

const listeners: Callback[] = [];

export const onPostCreated = (cb: Callback) => {
  listeners.push(cb);
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(cb);
    if (index > -1) listeners.splice(index, 1);
  };
};

export const triggerPostCreated = (post: Post) => {
  console.log(`🔔 triggerPostCreated called, notifying ${listeners.length} listeners`);
  listeners.forEach((cb) => cb(post));
};
