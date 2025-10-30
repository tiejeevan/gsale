// eventBus.ts
type Callback = () => void;

const listeners: Callback[] = [];

export const onPostCreated = (cb: Callback) => {
  listeners.push(cb);
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(cb);
    if (index > -1) listeners.splice(index, 1);
  };
};

export const triggerPostCreated = () => {
  listeners.forEach((cb) => cb());
};
