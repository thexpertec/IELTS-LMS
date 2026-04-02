import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface StudentSession {
  email: string;
  displayName: string;
}

interface StudentContextType {
  student: StudentSession | null;
  login: (email: string, displayName: string) => void;
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

  const login = (email: string, displayName: string) => {
    setStudent({ email, displayName });
  };

  const logout = () => {
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
