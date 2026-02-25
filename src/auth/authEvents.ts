type Listener = () => void;

const listeners = new Set<Listener>();

export function onUnauthorized(listener: Listener) {
  listeners.add(listener);

  // ✅ cleanup must return void
  return () => {
    listeners.delete(listener);
  };
}

export function emitUnauthorized() {
  for (const l of listeners) l();
}
