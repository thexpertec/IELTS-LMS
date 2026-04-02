import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isPast, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Megaphone, MessageSquare, Calendar, Trash2, Plus,
  ClipboardList, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Announcement = {
  id: number;
  courseId: number;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
};

type Discussion = {
  id: number;
  courseId: number;
  studentEmail: string;
  studentName: string;
  content: string;
  createdAt: string;
};

type UpcomingItem = {
  id: number;
  title: string;
  type: "quiz" | "assignment";
  date: string;
  maxScore?: number | null;
  isPublished?: boolean | null;
};

const fetchAnnouncements = (courseId: number) =>
  fetch(`/api/courses/${courseId}/announcements`).then((r) => r.json());
const fetchDiscussions = (courseId: number) =>
  fetch(`/api/courses/${courseId}/discussions`).then((r) => r.json());
const fetchUpcoming = (courseId: number) =>
  fetch(`/api/courses/${courseId}/upcoming`).then((r) => r.json());

export function StreamTab({ courseId }: { courseId: number }) {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const subTab = new URLSearchParams(search).get("sub") ?? "all";
  function setSubTab(v: string) {
    setLocation(`/courses/${courseId}?tab=stream&sub=${v}`);
  }

  const { data: announcements = [], isLoading: annLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements", courseId],
    queryFn: () => fetchAnnouncements(courseId),
  });
  const { data: discussions = [], isLoading: discLoading } = useQuery<Discussion[]>({
    queryKey: ["discussions", courseId],
    queryFn: () => fetchDiscussions(courseId),
  });
  const { data: upcoming = [], isLoading: upcomingLoading } = useQuery<UpcomingItem[]>({
    queryKey: ["upcoming", courseId],
    queryFn: () => fetchUpcoming(courseId),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id: number) => fetch(`/api/courses/${courseId}/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements", courseId] }),
  });
  const deleteDiscussion = useMutation({
    mutationFn: (id: number) => fetch(`/api/courses/${courseId}/discussions/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["discussions", courseId] }),
  });

  const allItems = [
    ...announcements.map((a) => ({ ...a, _type: "announcement" as const })),
    ...discussions.map((d) => ({ ...d, _type: "discussion" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalCount = announcements.length + discussions.length;

  return (
    <Tabs value={subTab} onValueChange={setSubTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="all">
          All
          {totalCount > 0 && <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5">{totalCount}</span>}
        </TabsTrigger>
        <TabsTrigger value="announcements">
          <Megaphone className="w-3.5 h-3.5 mr-1.5" />
          Announcements
          {announcements.length > 0 && <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5">{announcements.length}</span>}
        </TabsTrigger>
        <TabsTrigger value="discussions">
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          Discussions
          {discussions.length > 0 && <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5">{discussions.length}</span>}
        </TabsTrigger>
        <TabsTrigger value="upcoming">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Upcoming
          {upcoming.length > 0 && <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5">{upcoming.length}</span>}
        </TabsTrigger>
      </TabsList>

      {/* ── ALL ── */}
      <TabsContent value="all" className="space-y-3 mt-0">
        {annLoading || discLoading ? (
          <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
        ) : allItems.length === 0 ? (
          <EmptyState icon={Megaphone} text="Nothing posted yet. Post an announcement or discussion to get started." />
        ) : (
          allItems.map((item) =>
            item._type === "announcement" ? (
              <AnnouncementCard
                key={`ann-${item.id}`}
                ann={item as Announcement}
                onDelete={() => deleteAnnouncement.mutate(item.id)}
              />
            ) : (
              <DiscussionCard
                key={`disc-${item.id}`}
                disc={item as Discussion}
                onDelete={() => deleteDiscussion.mutate(item.id)}
              />
            )
          )
        )}
      </TabsContent>

      {/* ── ANNOUNCEMENTS ── */}
      <TabsContent value="announcements" className="space-y-4 mt-0">
        <PostAnnouncementForm courseId={courseId} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["announcements", courseId] })} />
        {annLoading ? (
          <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
        ) : announcements.length === 0 ? (
          <EmptyState icon={Megaphone} text="No announcements yet. Post one above to notify your students." />
        ) : (
          announcements.map((ann) => (
            <AnnouncementCard key={ann.id} ann={ann} onDelete={() => deleteAnnouncement.mutate(ann.id)} />
          ))
        )}
      </TabsContent>

      {/* ── DISCUSSIONS ── */}
      <TabsContent value="discussions" className="space-y-4 mt-0">
        <PostDiscussionForm courseId={courseId} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["discussions", courseId] })} />
        {discLoading ? (
          <div className="space-y-3"><Skeleton className="h-24 w-full" /></div>
        ) : discussions.length === 0 ? (
          <EmptyState icon={MessageSquare} text="No discussions yet." />
        ) : (
          discussions.map((disc) => (
            <DiscussionCard key={disc.id} disc={disc} onDelete={() => deleteDiscussion.mutate(disc.id)} />
          ))
        )}
      </TabsContent>

      {/* ── UPCOMING ── */}
      <TabsContent value="upcoming" className="space-y-3 mt-0">
        {upcomingLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : upcoming.length === 0 ? (
          <EmptyState icon={Calendar} text="No upcoming items." />
        ) : (
          <div className="space-y-2">
            {upcoming.map((item) => (
              <Card key={`${item.type}-${item.id}`} className={cn(
                "p-4 flex items-center gap-4",
                isPast(new Date(item.date)) && "opacity-60"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                  item.type === "quiz" ? "bg-blue-500/10" : "bg-orange-500/10"
                )}>
                  {item.type === "quiz"
                    ? <ClipboardList className="w-4 h-4 text-blue-600" />
                    : <FileText className="w-4 h-4 text-orange-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "text-[10px] h-4 px-1.5",
                      item.type === "quiz" ? "text-blue-600 border-blue-500/40" : "text-orange-600 border-orange-500/40"
                    )}>
                      {item.type === "quiz" ? "Quiz" : "Assignment"}
                    </Badge>
                    {isPast(new Date(item.date)) && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-red-500 border-red-400/40">Past due</Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm mt-0.5 truncate">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {item.type === "assignment" ? "Due" : "Created"}:{" "}
                    <span className={cn("font-medium", isPast(new Date(item.date)) ? "text-red-500" : "text-foreground")}>
                      {format(new Date(item.date), "MMM d, yyyy")}
                    </span>
                    {" · "}
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                  </p>
                </div>
                {item.maxScore && (
                  <span className="text-xs font-medium text-muted-foreground flex-shrink-0">/{item.maxScore} pts</span>
                )}
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="border-2 border-dashed rounded-xl p-12 text-center">
      <Icon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
}

function AnnouncementCard({ ann, onDelete }: { ann: Announcement; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = ann.content.length > 200;
  return (
    <Card className="p-4 space-y-2 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{ann.authorName}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-primary border-primary/40">Announcement</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
              <AlertDialogDescription>Delete this announcement? This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <h3 className="font-bold text-base">{ann.title}</h3>
      <p className={cn("text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap", !expanded && isLong && "line-clamp-3")}>
        {ann.content}
      </p>
      {isLong && (
        <button className="text-xs text-primary font-medium flex items-center gap-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Read more</>}
        </button>
      )}
    </Card>
  );
}

function DiscussionCard({ disc, onDelete }: { disc: Discussion; onDelete: () => void }) {
  return (
    <Card className="p-4 space-y-2 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-blue-600">
              {disc.studentName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{disc.studentName}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-blue-600 border-blue-500/40">Discussion</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{disc.studentEmail} · {formatDistanceToNow(new Date(disc.createdAt), { addSuffix: true })}</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Discussion</AlertDialogTitle>
              <AlertDialogDescription>Delete this post? This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{disc.content}</p>
    </Card>
  );
}

function PostAnnouncementForm({ courseId, onSuccess }: { courseId: number; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("Instructor");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () =>
      fetch(`/api/courses/${courseId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, authorName }),
      }).then((r) => r.json()),
    onSuccess: () => {
      onSuccess();
      setTitle("");
      setContent("");
      setOpen(false);
      toast({ title: "Announcement posted" });
    },
    onError: () => toast({ title: "Failed to post", variant: "destructive" }),
  });

  if (!open) {
    return (
      <Button variant="outline" className="w-full gap-2" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Post Announcement
      </Button>
    );
  }

  return (
    <Card className="p-4 space-y-3 border-primary/30">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-primary" />
        New Announcement
      </h3>
      <Input placeholder="Author name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="h-9" />
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" />
      <Textarea
        placeholder="Write your announcement…"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => mutation.mutate()} disabled={!title.trim() || !content.trim() || mutation.isPending}>
          Post
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </Card>
  );
}

function PostDiscussionForm({ courseId, onSuccess }: { courseId: number; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () =>
      fetch(`/api/courses/${courseId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, studentEmail, studentName }),
      }).then((r) => r.json()),
    onSuccess: () => {
      onSuccess();
      setContent("");
      setStudentName("");
      setStudentEmail("");
      setOpen(false);
      toast({ title: "Discussion posted" });
    },
    onError: () => toast({ title: "Failed to post", variant: "destructive" }),
  });

  if (!open) {
    return (
      <Button variant="outline" className="w-full gap-2" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Start Discussion
      </Button>
    );
  }

  return (
    <Card className="p-4 space-y-3 border-blue-500/30">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blue-600" />
        Start a Discussion
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Your name" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="h-9" />
        <Input placeholder="Your email" type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="h-9" />
      </div>
      <Textarea
        placeholder="Write your message…"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => mutation.mutate()} disabled={!content.trim() || !studentName.trim() || !studentEmail.trim() || mutation.isPending}>
          Post
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </Card>
  );
}
