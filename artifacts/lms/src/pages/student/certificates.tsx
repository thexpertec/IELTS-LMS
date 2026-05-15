import { useState } from "react";
import {
  Award, Download, Share2, ExternalLink, CheckCircle2,
  Calendar, BookOpen, Star, Lock, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStudent } from "@/context/student-context";

interface Certificate {
  id: string; title: string; course: string; instructor: string;
  issueDate: string; band?: number; credentialId: string;
  earned: boolean; progress?: number; color: string; icon: string;
}

const CERTIFICATES: Certificate[] = [
  {
    id: "cert-001", title: "IELTS Academic Complete Course",
    course: "IELTS Academic Complete — Band 7+ Guarantee",
    instructor: "Dr. Sarah Mitchell", issueDate: "2026-05-09",
    band: 6.5, credentialId: "ONS-2026-AC-00471",
    earned: true, color: "from-indigo-600 to-violet-600", icon: "🎓",
  },
  {
    id: "cert-002", title: "IELTS Writing Masterclass",
    course: "Writing Task 1 & Task 2 — Band 7",
    instructor: "Prof. James Chen", issueDate: "2026-04-28",
    band: 6.0, credentialId: "ONS-2026-WM-00312",
    earned: true, color: "from-emerald-600 to-teal-600", icon: "✍️",
  },
  {
    id: "cert-003", title: "Speaking Band 7+",
    course: "30-Day Speaking Intensive",
    instructor: "Emma Watson",
    earned: false, progress: 68, credentialId: "",
    issueDate: "", color: "from-amber-500 to-orange-600", icon: "🎙️",
  },
  {
    id: "cert-004", title: "Vocabulary Builder — Advanced",
    course: "Academic Vocabulary Mastery",
    instructor: "OneSoft Team",
    earned: false, progress: 40, credentialId: "",
    issueDate: "", color: "from-rose-500 to-pink-600", icon: "📚",
  },
];

function CertPreview({ cert, studentName }: { cert: Certificate; studentName: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br min-h-[200px]", cert.color)}>
      {/* Decorative rings */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border-4 border-white/10" />
      <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full border-4 border-white/10" />
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Certificate of Completion</p>
            <p className="font-bold text-sm">OneSoft IELTS Academy</p>
          </div>
          <span className="text-3xl">{cert.icon}</span>
        </div>

        <p className="text-xs text-white/70 mb-0.5">This is to certify that</p>
        <p className="text-xl font-extrabold mb-1">{studentName}</p>
        <p className="text-xs text-white/70 mb-0.5">has successfully completed</p>
        <p className="text-base font-bold mb-3">{cert.title}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {cert.band && (
              <div className="text-center">
                <p className="text-[10px] text-white/60">Band Score</p>
                <p className="text-2xl font-extrabold">{cert.band}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-white/60">Issued</p>
              <p className="text-xs font-semibold">{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/60">Credential ID</p>
            <p className="text-xs font-mono font-semibold">{cert.credentialId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const { student } = useStudent();
  const studentName = student?.displayName ?? "Student";
  const [viewing, setViewing] = useState<Certificate | null>(null);
  const earned = CERTIFICATES.filter((c) => c.earned);
  const inProgress = CERTIFICATES.filter((c) => !c.earned);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-[#CC0000]" /> My Certificates
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Verifiable credentials for your IELTS course completions</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
          <Award className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{earned.length} earned</span>
        </div>
      </div>

      {/* Full-screen preview modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CertPreview cert={viewing} studentName={studentName} />
            <div className="flex gap-3 mt-4">
              <Button className="flex-1 bg-[#0d1b60] hover:bg-[#162270] gap-2">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" /> Share
              </Button>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" /> Verify
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Credential ID: <span className="font-mono">{viewing.credentialId}</span>
            </p>
            <button onClick={() => setViewing(null)} className="w-full mt-3 text-xs text-muted-foreground hover:text-slate-700 transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Earned certificates */}
      {earned.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Earned Certificates ({earned.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {earned.map((cert) => (
              <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-all group">
                <div className="cursor-pointer" onClick={() => setViewing(cert)}>
                  <CertPreview cert={cert} studentName={studentName} />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-bold text-sm">{cert.title}</p>
                      <p className="text-xs text-muted-foreground">{cert.instructor}</p>
                    </div>
                    <Badge className="bg-emerald-500 text-white text-[10px]">Verified</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(cert.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {cert.band && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />Band {cert.band}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-[#0d1b60] hover:bg-[#162270] h-8 text-xs gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setViewing(cert)}>
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* In-progress */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" /> In Progress ({inProgress.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {inProgress.map((cert) => (
              <Card key={cert.id} className="overflow-hidden opacity-75">
                <div className={cn("relative p-5 text-white bg-gradient-to-br min-h-[100px] flex items-center gap-4", cert.color, "opacity-60")}>
                  <span className="text-3xl grayscale">{cert.icon}</span>
                  <div>
                    <p className="font-bold">{cert.title}</p>
                    <p className="text-white/70 text-xs">{cert.course}</p>
                  </div>
                  <Lock className="absolute top-4 right-4 w-5 h-5 text-white/50" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="text-xs font-bold">{cert.progress}%</p>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div style={{ width: `${cert.progress}%` }}
                      className={cn("h-full rounded-full bg-gradient-to-r", cert.color, "transition-all")} />
                  </div>
                  <p className="text-xs text-muted-foreground">Complete the course to earn this certificate</p>
                  <Button size="sm" variant="outline" className="mt-3 w-full h-8 text-xs gap-1">
                    Continue learning <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Verification info */}
      <Card className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-sm text-indigo-800 dark:text-indigo-300 mb-1">Blockchain-Verified Credentials</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed mb-2">
                All OneSoft IELTS certificates include a unique credential ID that can be verified by employers, universities, and institutions at <strong>verify.onesoft.io</strong>
              </p>
              <Button size="sm" variant="outline" className="h-7 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-100">
                <ExternalLink className="w-3 h-3 mr-1" /> Learn about verification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
