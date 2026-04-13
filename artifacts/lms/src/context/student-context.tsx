import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface StudentSession {
  email: string;
  displayName: string;
}

interface StudentContextType {
  student: StudentSession | null;
  isAdminPreview: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  startAdminPreview: () => void;
  exitAdminPreview: () => void;
}

const StudentContext = createContext<StudentContextType | null>(null);

const STORAGE_KEY = "lms_student_session";
const ADMIN_PREVIEW_KEY = "lms_admin_preview";

const PREVIEW_SESSION: StudentSession = {
  email: "admin-preview@lms.local",
  displayName: "Admin Preview",
};

export function StudentProvider({ children }: { children: ReactNode }) {
  const [isAdminPreview, setIsAdminPreview] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_PREVIEW_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [student, setStudent] = useState<StudentSession | null>(() => {
    try {
      if (localStorage.getItem(ADMIN_PREVIEW_KEY) === "1") return PREVIEW_SESSION;
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StudentSession) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (isAdminPreview) {
      localStorage.setItem(ADMIN_PREVIEW_KEY, "1");
      setStudent(PREVIEW_SESSION);
    } else {
      localStorage.removeItem(ADMIN_PREVIEW_KEY);
    }
  }, [isAdminPreview]);

  useEffect(() => {
    if (isAdminPreview) return;
    if (student) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [student, isAdminPreview]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json() as { message: string };
      throw new Error(err.message ?? "Invalid credentials");
    }
    const data = await res.json() as { name: string; email: string; role: string };
    if (data.role !== "student") {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      throw new Error("This login is for students only. Use Admin login instead.");
    }
    setStudent({ email: data.email, displayName: data.name });
  };

  const logout = () => {
    if (!isAdminPreview) {
      void fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    }
    setStudent(null);
    setIsAdminPreview(false);
  };

  const startAdminPreview = () => {
    setIsAdminPreview(true);
  };

  const exitAdminPreview = () => {
    setIsAdminPreview(false);
    setStudent(null);
  };

  return (
    <StudentContext.Provider value={{ student, isAdminPreview, login, logout, startAdminPreview, exitAdminPreview }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
