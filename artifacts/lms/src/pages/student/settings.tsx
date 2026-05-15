import { useState } from "react";
import {
  Settings, User, Bell, Moon, Sun, Globe, Shield, Target,
  Calendar, Clock, Save, ChevronRight, Check, Eye, EyeOff,
  Laptop,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStudent } from "@/context/student-context";
import { useTheme } from "@/components/theme-provider";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "learning", label: "Learning", icon: Target },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Moon },
  { id: "privacy", label: "Privacy & Security", icon: Shield },
];

export default function SettingsPage() {
  const { student } = useStudent();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState(student?.displayName ?? "");
  const [email] = useState(student?.email ?? "");
  const [city, setCity] = useState("Lahore");
  const [country, setCountry] = useState("Pakistan");
  const [bio, setBio] = useState("IELTS student aiming for Band 7+ in Academic module.");

  // Learning preferences
  const [targetBand, setTargetBand] = useState("7.0");
  const [testDate, setTestDate] = useState("2026-08-15");
  const [dailyGoal, setDailyGoal] = useState("60");
  const [testType, setTestType] = useState("Academic");
  const [focusModules, setFocusModules] = useState(["Writing", "Vocabulary"]);

  // Notifications
  const [notifStudyReminder, setNotifStudyReminder] = useState(true);
  const [notifDeadlines, setNotifDeadlines] = useState(true);
  const [notifNewContent, setNotifNewContent] = useState(true);
  const [notifProgressReport, setNotifProgressReport] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);

  // Privacy
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const modules = ["Listening", "Reading", "Writing", "Speaking", "Vocabulary", "Mock Tests"];

  function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
      <button onClick={onChange}
        className={cn("relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none",
          checked ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700")}>
        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-5")} />
      </button>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#CC0000]" /> Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account, preferences, and notifications</p>
        </div>
        <Button onClick={handleSave} className={cn("gap-2 transition-colors", saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#0d1b60] hover:bg-[#162270]")}>
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveSection(id)}
                  className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                    activeSection === id ? "bg-[#0d1b60] text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {activeSection !== id && <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">

          {/* PROFILE */}
          {activeSection === "profile" && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0d1b60] to-indigo-500 flex items-center justify-center text-white text-2xl font-extrabold">
                    {displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                    <Button variant="outline" size="sm" className="mt-1.5 h-7 text-xs">Change photo</Button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", value: displayName, onChange: setDisplayName, placeholder: "Your full name" },
                    { label: "Email Address", value: email, onChange: () => {}, placeholder: "Email", disabled: true },
                    { label: "City", value: city, onChange: setCity, placeholder: "Your city" },
                    { label: "Country", value: country, onChange: setCountry, placeholder: "Your country" },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                      <input value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder={f.placeholder} disabled={f.disabled}
                        className={cn("w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all dark:bg-slate-900 dark:border-slate-700",
                          f.disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900")} />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none dark:bg-slate-900 dark:border-slate-700" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* LEARNING */}
          {activeSection === "learning" && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Learning Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Target Band Score</label>
                    <select value={targetBand} onChange={(e) => setTargetBand(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:bg-slate-900 dark:border-slate-700">
                      {["5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0"].map((b) => (
                        <option key={b} value={b}>Band {b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Test Type</label>
                    <div className="flex gap-2">
                      {["Academic", "General Training"].map((t) => (
                        <button key={t} onClick={() => setTestType(t)}
                          className={cn("flex-1 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-colors",
                            testType === t ? "bg-[#0d1b60] text-white border-[#0d1b60]" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300")}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Test Date</label>
                    <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:bg-slate-900 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Daily Study Goal</label>
                    <select value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:bg-slate-900 dark:border-slate-700">
                      {["30","45","60","90","120"].map((m) => (
                        <option key={m} value={m}>{m} minutes per day</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Focus Modules</label>
                  <div className="flex flex-wrap gap-2">
                    {modules.map((m) => (
                      <button key={m} onClick={() => setFocusModules((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                          focusModules.includes(m) ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300")}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {testDate && (
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                    <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-1">📅 Your test is coming up</p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400">
                      {Math.max(0, Math.ceil((new Date(testDate).getTime() - Date.now()) / 86400000))} days until your IELTS exam — stay consistent!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Daily Study Reminders", desc: "Get reminded to study at your scheduled time", checked: notifStudyReminder, onChange: () => setNotifStudyReminder((v) => !v) },
                  { label: "Assignment Deadlines", desc: "Alerts before your assignments are due", checked: notifDeadlines, onChange: () => setNotifDeadlines((v) => !v) },
                  { label: "New Course Content", desc: "Notify when instructors add new lessons", checked: notifNewContent, onChange: () => setNotifNewContent((v) => !v) },
                  { label: "Weekly Progress Reports", desc: "Email summary of your weekly learning activity", checked: notifProgressReport, onChange: () => setNotifProgressReport((v) => !v) },
                  { label: "Email Notifications", desc: "Receive all notifications via email as well", checked: notifEmail, onChange: () => setNotifEmail((v) => !v) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Toggle checked={item.checked} onChange={item.onChange} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* APPEARANCE */}
          {activeSection === "appearance" && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Moon className="w-4 h-4 text-primary" /> Appearance</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "system", label: "System", icon: Laptop },
                    ].map(({ value, label, icon: Icon }) => (
                      <button key={value} onClick={() => setTheme(value as "light" | "dark" | "system")}
                        className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          theme === value ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300")}>
                        <Icon className={cn("w-5 h-5", theme === value ? "text-indigo-600" : "text-slate-400")} />
                        <span className={cn("text-xs font-semibold", theme === value ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500")}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Language</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:bg-slate-900 dark:border-slate-700">
                    <option>English (UK)</option>
                    <option>English (US)</option>
                    <option>Urdu</option>
                    <option>Arabic</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PRIVACY */}
          {activeSection === "privacy" && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Current Password", value: currentPw, onChange: setCurrentPw },
                    { label: "New Password", value: newPw, onChange: setNewPw },
                    { label: "Confirm New Password", value: confirmPw, onChange: setConfirmPw },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={f.value} onChange={(e) => f.onChange(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:bg-slate-900 dark:border-slate-700" />
                        <button onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">Update Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Privacy</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Leaderboard visibility</p>
                      <p className="text-xs text-muted-foreground">Show your name and XP on the class leaderboard</p>
                    </div>
                    <Toggle checked={leaderboardVisible} onChange={() => setLeaderboardVisible((v) => !v)} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-200 dark:border-rose-900">
                <CardContent className="p-4">
                  <p className="text-sm font-bold text-rose-600 mb-1">Danger Zone</p>
                  <p className="text-xs text-muted-foreground mb-3">Once you delete your account, there is no going back. All your progress and certificates will be lost.</p>
                  <Button variant="outline" size="sm" className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700">Delete Account</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
