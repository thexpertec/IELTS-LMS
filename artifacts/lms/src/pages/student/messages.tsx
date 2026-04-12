import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useStudent } from "@/context/student-context";

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

function MessageBubble({ msg }: { msg: Message }) {
  return (
    <div className={cn("flex gap-2 max-w-[78%]", msg.isOwn ? "ml-auto flex-row-reverse" : "")}>
      {!msg.isOwn && (
        <Avatar className="w-7 h-7 shrink-0 mt-1">
          <AvatarFallback className="text-[10px] font-bold bg-primary text-white">AD</AvatarFallback>
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

export default function StudentMessages() {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { student } = useStudent();
  const queryClient = useQueryClient();

  // Fetch conversations to discover the admin email
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["student-chat-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/chat/conversations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!student,
  });

  const admin = conversations[0] ?? null;

  // Fetch messages with admin
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["student-chat-messages", admin?.email],
    queryFn: async () => {
      const res = await fetch(`/api/chat/messages?with=${encodeURIComponent(admin!.email)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!admin,
    refetchInterval: 3000,
  });

  // Mark as read when conversation is opened
  useEffect(() => {
    if (!admin) return;
    fetch(`/api/chat/read?from=${encodeURIComponent(admin.email)}`, {
      method: "PATCH",
      credentials: "include",
    }).then(() => queryClient.invalidateQueries({ queryKey: ["student-chat-conversations"] })).catch(() => {});
  }, [admin, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: admin!.email, content }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json() as Promise<Message>;
    },
    onSuccess: (msg) => {
      queryClient.setQueryData<Message[]>(["student-chat-messages", admin?.email], (old = []) => [...old, msg]);
      queryClient.invalidateQueries({ queryKey: ["student-chat-conversations"] });
      setDraft("");
    },
  });

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !admin || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b bg-card shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Chat directly with your instructor</p>
      </div>

      {!admin ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <MessageSquare className="w-12 h-12 opacity-20" />
          <p className="text-sm font-medium">No instructor found for your account</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden max-w-3xl w-full mx-auto">
          {/* Instructor header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b bg-muted/30 shrink-0">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary text-white text-sm font-bold">
                {admin.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{admin.name}</p>
              <p className="text-xs text-muted-foreground">Instructor · Online</p>
            </div>
          </div>

          {/* Messages area */}
          <ScrollArea className="flex-1 px-5 py-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={cn("flex gap-2", i % 2 !== 0 ? "flex-row-reverse ml-auto" : "")}>
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <Skeleton className="h-10 rounded-2xl" style={{ width: `${120 + i * 40}px` }} />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                <MessageSquare className="w-10 h-10 opacity-25" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs">Send a message to your instructor to get started</p>
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
          <div className="border-t p-4 bg-card shrink-0">
            <form
              className="flex gap-2"
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            >
              <Input
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
              />
              <Button type="submit" size="icon" disabled={!draft.trim() || sendMutation.isPending || !admin}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
