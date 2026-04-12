import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface StudentSession {
  email: string;
  displayName: string;
}

interface StudentContextType {
  student: StudentSession | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const StudentContext = createContext<StudentContextType | null>(null);

const STORAGE_KEY = "lms_student_session";

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentSession | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StudentSession) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (student) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [student]);

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
    void fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setStudent(null);
  };

  return (
    <StudentContext.Provider value={{ student, login, logout }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
