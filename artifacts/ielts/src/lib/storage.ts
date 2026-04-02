import { useEffect, useState } from "react";

export interface IeltsData {
  profile: {
    name: string;
    email: string;
    bio: string;
    joinedDate: string;
  };
  session: {
    loggedIn: boolean;
  };
  progress: Record<
    string,
    {
      lessonsCompleted: string[];
      quizScores: Record<string, number>;
      assignmentsSubmitted: string[];
    }
  >;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "reminder";
    read: boolean;
    date: string;
  }>;
}

const STORAGE_KEY = "ielts_data";

const DEFAULT_DATA: IeltsData = {
  profile: {
    name: "",
    email: "",
    bio: "",
    joinedDate: new Date().toISOString(),
  },
  session: {
    loggedIn: false,
  },
  progress: {
    reading: { lessonsCompleted: [], quizScores: {}, assignmentsSubmitted: [] },
    writing: { lessonsCompleted: [], quizScores: {}, assignmentsSubmitted: [] },
    listening: { lessonsCompleted: [], quizScores: {}, assignmentsSubmitted: [] },
    speaking: { lessonsCompleted: [], quizScores: {}, assignmentsSubmitted: [] },
    grammar: { lessonsCompleted: [], quizScores: {}, assignmentsSubmitted: [] },
    vocabulary: { lessonsCompleted: [], quizScores: {}, assignmentsSubmitted: [] },
  },
  notifications: [
    {
      id: "1",
      title: "Welcome to IELTS Prep!",
      message: "We're excited to help you achieve your target band score.",
      type: "info",
      read: false,
      date: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Writing Task 1",
      message: "Don't forget to submit your first assignment in the Writing module.",
      type: "reminder",
      read: false,
      date: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

export function getStorageData(): IeltsData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading localStorage", e);
  }
  return DEFAULT_DATA;
}

export function setStorageData(data: IeltsData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("storage_update"));
  } catch (e) {
    console.error("Error writing localStorage", e);
  }
}

export function useIeltsData() {
  const [data, setData] = useState<IeltsData>(getStorageData());

  useEffect(() => {
    const handleUpdate = () => {
      setData(getStorageData());
    };
    window.addEventListener("storage_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("storage_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateData = (newData: IeltsData | ((prev: IeltsData) => IeltsData)) => {
    const next = typeof newData === "function" ? newData(data) : newData;
    setStorageData(next);
  };

  return { data, updateData };
}
