import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Tone = "success" | "error";
interface Toast {
  id: number;
  tone: Tone;
  text: string;
}

interface AdminToastContextValue {
  success: (text: string) => void;
  error: (text: string) => void;
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (tone: Tone, text: string) => {
      seq.current += 1;
      const id = seq.current;
      setToasts((list) => [...list, { id, tone, text }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4200),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) clearTimeout(timer);
      map.clear();
    };
  }, []);

  const value = useMemo<AdminToastContextValue>(
    () => ({
      success: (text) => push("success", text),
      error: (text) => push("error", text),
    }),
    [push],
  );

  return (
    <AdminToastContext value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm shadow-lift ${
                toast.tone === "success"
                  ? "border-success/30 bg-panel text-success"
                  : "border-danger/30 bg-panel text-danger"
              }`}
              onClick={() => dismiss(toast.id)}
            >
              {toast.tone === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span className="text-ink">{toast.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AdminToastContext>
  );
}

export function useAdminToast(): AdminToastContextValue {
  const ctx = useContext(AdminToastContext);
  if (!ctx) throw new Error("useAdminToast must be used within <AdminToastProvider>");
  return ctx;
}
