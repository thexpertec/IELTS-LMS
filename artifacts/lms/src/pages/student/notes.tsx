import { useState } from "react";
import {
  StickyNote, Plus, Search, Trash2, Edit3, Save, X,
  Tag, Calendar, BookOpen, Star, Grid, List,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Note {
  id: string; title: string; content: string;
  tags: string[]; color: string; starred: boolean;
  module: string; createdAt: string; updatedAt: string;
}

const COLORS = ["yellow", "blue", "green", "pink", "purple", "orange"];
const COLOR_MAP: Record<string, string> = {
  yellow: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
  blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  green: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  pink: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800",
  purple: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
  orange: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
};
const COLOR_DOT: Record<string, string> = {
  yellow: "bg-yellow-400", blue: "bg-blue-400", green: "bg-emerald-400",
  pink: "bg-pink-400", purple: "bg-violet-400", orange: "bg-orange-400",
};

const INITIAL_NOTES: Note[] = [
  { id: "n1", title: "Writing Task 2 — Argument Structure", content: "PEEL structure:\n• Point — state your main idea\n• Evidence — give a specific example\n• Explanation — explain why this supports your point\n• Link — connect back to the question\n\nAlways use signposting: 'Furthermore', 'However', 'In contrast', 'To illustrate'", tags: ["Writing", "Task 2", "Structure"], color: "yellow", starred: true, module: "Writing", createdAt: "2026-05-10", updatedAt: "2026-05-12" },
  { id: "n2", title: "Listening Section 3 — Tips", content: "• Read the questions BEFORE the audio starts\n• The answers follow question order\n• Watch for synonyms — the audio rarely uses the exact question words\n• Distractor answers are common — the speaker often changes their mind\n• Number of letters required matters (e.g., 'ONE WORD ONLY')", tags: ["Listening", "Tips"], color: "blue", starred: false, module: "Listening", createdAt: "2026-05-08", updatedAt: "2026-05-08" },
  { id: "n3", title: "Band 7 Vocabulary List", content: "Verbs: substantiate, mitigate, proliferate, exacerbate, advocate\nAdjectives: pragmatic, inevitable, detrimental, comprehensive\nNouns: paradigm, correlation, implication, perspective, framework\n\nCollocations: 'have a significant impact on', 'play a crucial role in', 'give rise to'", tags: ["Vocabulary", "Band 7"], color: "green", starred: true, module: "Vocabulary", createdAt: "2026-05-05", updatedAt: "2026-05-11" },
  { id: "n4", title: "Speaking Part 2 — Cue Card Strategy", content: "1. Use all 60 seconds of prep time\n2. Write key words (not sentences)\n3. Structure: When/Where → Who → What → Why/Feelings\n4. Aim for 2 full minutes\n5. Use narrative tenses: 'I was walking... when suddenly...'\n6. Add sensory details to extend your answer", tags: ["Speaking", "Part 2"], color: "pink", starred: false, module: "Speaking", createdAt: "2026-05-03", updatedAt: "2026-05-03" },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [editing, setEditing] = useState<Note | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("All");
  const [filterModule, setFilterModule] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  const allTags = ["All", ...Array.from(new Set(notes.flatMap((n) => n.tags)))];
  const allModules = ["All", ...Array.from(new Set(notes.map((n) => n.module)))];

  const filtered = notes.filter((n) => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTag !== "All" && !n.tags.includes(filterTag)) return false;
    if (filterModule !== "All" && n.module !== filterModule) return false;
    return true;
  });

  function newNote() {
    const blank: Note = {
      id: `n${Date.now()}`, title: "", content: "",
      tags: [], color: "yellow", starred: false,
      module: "General", createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setEditing(blank);
    setIsNew(true);
  }

  function saveNote() {
    if (!editing) return;
    if (!editing.title.trim()) return;
    if (isNew) {
      setNotes((prev) => [editing, ...prev]);
    } else {
      setNotes((prev) => prev.map((n) => n.id === editing.id ? { ...editing, updatedAt: new Date().toISOString().slice(0, 10) } : n));
    }
    setEditing(null);
    setIsNew(false);
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  function toggleStar(id: string) {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, starred: !n.starred } : n));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-[#CC0000]" /> My Notes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{notes.length} notes · {notes.filter((n) => n.starred).length} starred</p>
        </div>
        <Button onClick={newNote} className="bg-[#0d1b60] hover:bg-[#162270] gap-2">
          <Plus className="w-4 h-4" /> New Note
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…"
            className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-44" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {allModules.map((m) => (
            <button key={m} onClick={() => setFilterModule(m)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all",
                filterModule === m ? "bg-[#0d1b60] text-white border-[#0d1b60]" : "border-slate-200 dark:border-slate-700 hover:border-slate-300")}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden ml-auto">
          <button onClick={() => setView("grid")} className={cn("p-2 transition-colors", view === "grid" ? "bg-[#0d1b60] text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={cn("p-2 transition-colors", view === "list" ? "bg-[#0d1b60] text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tag chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {allTags.map((tag) => (
          <button key={tag} onClick={() => setFilterTag(tag)}
            className={cn("px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all",
              filterTag === tag ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300")}>
            {tag}
          </button>
        ))}
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setEditing(null); setIsNew(false); }}>
          <div className={cn("rounded-2xl border shadow-2xl w-full max-w-lg overflow-hidden", COLOR_MAP[editing.color])} onClick={(e) => e.stopPropagation()}>
            {/* Color picker */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-black/5">
              <span className="text-xs text-slate-500 font-medium">Color:</span>
              {COLORS.map((c) => (
                <button key={c} onClick={() => setEditing({ ...editing, color: c })}
                  className={cn("w-5 h-5 rounded-full transition-all border-2", COLOR_DOT[c], editing.color === c ? "border-slate-800 scale-125" : "border-transparent")} />
              ))}
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="ml-auto text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-3">
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Note title…"
                className="w-full bg-transparent text-lg font-bold placeholder:text-slate-400 focus:outline-none" />

              <textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                placeholder="Write your note here…"
                rows={8}
                className="w-full bg-transparent text-sm leading-relaxed placeholder:text-slate-400 focus:outline-none resize-none" />

              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <input
                  placeholder="Add tags (comma-separated)…"
                  defaultValue={editing.tags.join(", ")}
                  onBlur={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                  className="flex-1 bg-transparent text-xs placeholder:text-slate-400 focus:outline-none" />
              </div>

              <div className="flex gap-2 pt-2 border-t border-black/5">
                <Button onClick={saveNote} disabled={!editing.title.trim()} className="flex-1 bg-[#0d1b60] hover:bg-[#162270] gap-2 h-9">
                  <Save className="w-3.5 h-3.5" /> {isNew ? "Create Note" : "Save Changes"}
                </Button>
                {!isNew && (
                  <Button variant="outline" onClick={() => deleteNote(editing.id)} className="h-9 text-rose-500 border-rose-200 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes grid/list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <StickyNote className="w-12 h-12 opacity-20 mx-auto mb-3" />
          <p className="font-semibold text-slate-500">No notes found</p>
          <p className="text-sm text-muted-foreground">Create a note or change your filters</p>
          <Button onClick={newNote} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" /> Create note</Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0)).map((note) => (
            <div key={note.id}
              className={cn("rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md group", COLOR_MAP[note.color])}
              onClick={() => { setEditing({ ...note }); setIsNew(false); }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-bold text-sm line-clamp-1 flex-1">{note.title}</p>
                <button onClick={(e) => { e.stopPropagation(); toggleStar(note.id); }}
                  className={cn("flex-shrink-0 transition-colors", note.starred ? "text-amber-400" : "text-slate-300 hover:text-amber-300")}>
                  <Star className={cn("w-4 h-4", note.starred && "fill-amber-400")} />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-4 leading-relaxed mb-3 whitespace-pre-line">{note.content}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {note.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-400">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{note.updatedAt}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setEditing({ ...note }); setIsNew(false); }}
                    className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                    className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {/* Add new card */}
          <button onClick={newNote}
            className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all min-h-[160px]">
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">New note</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((note) => (
            <div key={note.id}
              className={cn("flex items-center gap-4 rounded-xl border px-4 py-3 cursor-pointer transition-all hover:shadow-sm group", COLOR_MAP[note.color])}
              onClick={() => { setEditing({ ...note }); setIsNew(false); }}>
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", COLOR_DOT[note.color])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{note.title}</p>
                  {note.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{note.content.substring(0, 80)}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex gap-1">{note.tags.slice(0, 2).map((t) => <span key={t} className="hidden sm:block">{t}</span>)}</span>
                <span>{note.updatedAt}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
