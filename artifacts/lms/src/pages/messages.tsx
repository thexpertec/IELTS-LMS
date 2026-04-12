import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Search, User, PenSquare, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";

type Conversation = {
  email: string;
  name: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

type Message = {
  id: number;
  fromEmail: string;
  toEmail: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  isOwn: boolean;
};

type StudentRow = {
  email: string;
  displayName: string;
  phone: string | null;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function MessageBubble({ msg }: { msg: Message }) {
  return (
    <div className={cn("flex gap-2 max-w-[75%]", msg.isOwn ? "ml-auto flex-row-reverse" : "")}>
      {!msg.isOwn && (
        <Avatar className="w-7 h-7 shrink-0 mt-1">
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">ST</AvatarFallback>
        </Avatar>
      )}
      <div>
        <div className={cn(
          "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
          msg.isOwn
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        )}>
          {msg.content}
        </div>
        <p className={cn("text-[10px] mt-1 text-muted-foreground", msg.isOwn ? "text-right" : "")}>
          {format(new Date(msg.createdAt), "h:mm a")}
        </p>
      </div>
    </div>
  );
}

export default function Messages() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSearch, setComposeSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // ── All conversations (existing) ──────────────────────────────────────────
  const { data: conversations = [], isLoading: loadingConvs } = useQuery<Conversation[]>({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load conversations");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // ── All students (for compose picker) ────────────────────────────────────
  const { data: allStudents = [] } = useQuery<StudentRow[]>({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const res = await fetch("/api/admin/students", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: composeOpen,
  });

  // ── Messages with selected student ───────────────────────────────────────
  const { data: messages = [], isLoading: loadingMsgs } = useQuery<Message[]>({
    queryKey: ["chat-messages", selected?.email],
    queryFn: async () => {
      if (!selected) return [];
      const res = await fetch(`/api/chat/messages?with=${encodeURIComponent(selected.email)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!selected,
    refetchInterval: 3000,
  });

  // ── Mark as read when opening a conversation ──────────────────────────────
  useEffect(() => {
    if (!selected) return;
    fetch(`/api/chat/read?from=${encodeURIComponent(selected.email)}`, {
      method: "PATCH",
      credentials: "include",
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    }).catch(() => {});
  }, [selected, queryClient]);

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selected!.email, content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json() as Promise<Message>;
    },
    onSuccess: (msg) => {
      queryClient.setQueryData<Message[]>(["chat-messages", selected?.email], (old = []) => [...old, msg]);
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      setDraft("");
    },
  });

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStudents = allStudents.filter(
    (s) =>
      s.displayName.toLowerCase().includes(composeSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(composeSearch.toLowerCase())
  );

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !selected || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  // Start or switch to a conversation with a student from the compose picker
  const startConversation = (student: StudentRow) => {
    const existing = conversations.find((c) => c.email === student.email);
    setSelected(existing ?? {
      email: student.email,
      name: student.displayName,
      lastMessage: "",
      lastAt: new Date().toISOString(),
      unread: 0,
    });
    setComposeOpen(false);
    setComposeSearch("");
    setDraft("");
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Compose / Student Picker Dialog ── */}
      <Dialog open={composeOpen} onOpenChange={(open) => { setComposeOpen(open); if (!open) setComposeSearch(""); }}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <DialogTitle className="text-base">New Message</DialogTitle>
          </DialogHeader>
          <div className="px-3 py-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search students by name or email…"
                className="pl-9 h-8 text-sm"
                value={composeSearch}
                onChange={(e) => setComposeSearch(e.target.value)}
              />
              {composeSearch && (
                <button
                  onClick={() => setComposeSearch("")}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <ScrollArea className="max-h-72">
            {filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {allStudents.length === 0 ? "No students found in this account." : "No students match your search."}
              </div>
            ) : (
              <div className="divide-y">
                {filteredStudents.map((student) => (
                  <button
                    key={student.email}
                    onClick={() => startConversation(student)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {initials(student.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{student.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                    </div>
                    {conversations.some((c) => c.email === student.email) && (
                      <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">Active</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Left Pane: Conversation List ── */}
      <div className="w-72 border-r bg-card flex flex-col shrink-0">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base px-1">Messages</h2>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => setComposeOpen(true)}
            >
              <PenSquare className="w-3.5 h-3.5" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations…"
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loadingConvs ? (
            <div className="p-3 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click <span className="font-semibold">New</span> above to message a student
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((conv) => (
                <button
                  key={conv.email}
                  onClick={() => setSelected(conv)}
                  className={cn(
                    "w-full flex gap-3 px-4 py-3 text-left transition-colors",
                    selected?.email === conv.email
                      ? "bg-primary/8 border-l-2 border-primary"
                      : "hover:bg-accent"
                  )}
                >
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback className={cn(
                      "text-xs font-semibold",
                      selected?.email === conv.email ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {initials(conv.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn("text-sm truncate", conv.unread > 0 && "font-semibold")}>
                        {conv.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {conv.lastAt ? formatTime(conv.lastAt) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage || "No messages yet"}
                      </p>
                      {conv.unread > 0 && (
                        <Badge className="h-4 min-w-4 px-1 text-[10px] bg-primary shrink-0">
                          {conv.unread > 9 ? "9+" : conv.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Right Pane: Chat Thread ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="w-7 h-7 opacity-40" />
            </div>
            <div>
              <p className="font-medium text-foreground">Start a conversation</p>
              <p className="text-sm mt-1">Pick an existing chat or click <strong>New</strong> to message a student</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setComposeOpen(true)}>
              <PenSquare className="w-4 h-4" />
              New Message
            </Button>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="h-14 border-b flex items-center px-5 gap-3 bg-card shrink-0">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {initials(selected.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.email}</p>
              </div>
            </div>

            {/* Messages area */}
            <ScrollArea className="flex-1 px-5 py-4">
              {loadingMsgs ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={cn("flex gap-2", i % 2 === 0 ? "" : "flex-row-reverse ml-auto")}>
                      <Skeleton className="w-7 h-7 rounded-full" />
                      <Skeleton className="h-10 rounded-2xl" style={{ width: `${150 + i * 30}px` }} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                  <User className="w-8 h-8 opacity-30" />
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs">Send {selected.name.split(" ")[0]} a message to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </ScrollArea>

            {/* Compose bar */}
            <div className="border-t p-3 bg-card shrink-0">
              <form
                className="flex gap-2"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              >
                <Input
                  placeholder={`Message ${selected.name.split(" ")[0]}…`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                />
                <Button type="submit" size="icon" disabled={!draft.trim() || sendMutation.isPending}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
