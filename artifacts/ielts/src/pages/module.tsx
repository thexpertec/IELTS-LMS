import { useState } from "react";
import { useParams } from "wouter";
import { useIeltsData } from "@/lib/storage";
import { MODULES } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, AlertCircle, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import NotFound from "./not-found";

const MODULE_DATA: Record<string, {
  lessons: { id: string; title: string; content: string }[];
  quiz: { id: string; question: string; options: string[]; answer: number }[];
  assignment: string;
}> = {
  reading: {
    lessons: [
      { id: "r1", title: "Passage Types & Skimming", content: "Focus on topic sentences to understand paragraph main ideas quickly. Don't read every word during the first pass. Skimming gives you the structural map." },
      { id: "r2", title: "True/False/Not Given", content: "True means the statement agrees with the info. False means it contradicts it. Not Given means the info isn't there—don't assume based on outside knowledge." },
      { id: "r3", title: "Matching Headings", content: "Read the headings first, then scan the paragraphs. Look for synonyms, not exact word matches. Pay attention to transition words." }
    ],
    quiz: [
      { id: "rq1", question: "What is the primary purpose of skimming?", options: ["To understand every detail", "To get the general idea", "To find specific names", "To check vocabulary"], answer: 1 },
      { id: "rq2", question: "If a statement is plausible but not mentioned in the text, it is:", options: ["True", "False", "Not Given", "Maybe"], answer: 2 },
      { id: "rq3", question: "When matching headings, you should look for:", options: ["Exact words", "Synonyms and related concepts", "Names only", "Dates only"], answer: 1 },
      { id: "rq4", question: "Topic sentences are usually found:", options: ["At the end of paragraphs", "In the middle of paragraphs", "At the beginning of paragraphs", "In the conclusion"], answer: 2 },
      { id: "rq5", question: "How much time should you spend on each reading passage?", options: ["10 minutes", "15 minutes", "20 minutes", "30 minutes"], answer: 2 }
    ],
    assignment: "Read the passage about climate change and answer 3 comprehension questions in the text area below."
  },
  writing: {
    lessons: [
      { id: "w1", title: "Task 1 – Describing Charts & Graphs", content: "Always include an overview sentence highlighting main trends. Don't list every single data point. Group similar data together to make comparisons." },
      { id: "w2", title: "Task 2 – Essay Structure", content: "Use a clear 4-5 paragraph structure: Introduction (hook + thesis), 2-3 body paragraphs (topic sentence + explanation + example), and Conclusion." },
      { id: "w3", title: "Linking Words & Cohesion", content: "Use transition words (Furthermore, Consequently, However) naturally. Overusing them or using them incorrectly will lower your coherence score." }
    ],
    quiz: [
      { id: "wq1", question: "What is essential in a Task 1 response?", options: ["Your personal opinion", "A clear overview of main trends", "Every single data point", "A long conclusion"], answer: 1 },
      { id: "wq2", question: "How many paragraphs are ideal for Task 2?", options: ["2", "4 or 5", "7", "1 large paragraph"], answer: 1 },
      { id: "wq3", question: "Which linking word shows contrast?", options: ["Furthermore", "Consequently", "However", "In addition"], answer: 2 },
      { id: "wq4", question: "In Task 2, what should each body paragraph start with?", options: ["An example", "A statistic", "A topic sentence", "A linking word"], answer: 2 },
      { id: "wq5", question: "What is the minimum word count for Task 2?", options: ["150 words", "200 words", "250 words", "300 words"], answer: 2 }
    ],
    assignment: "Write a 150-word description of the bar chart showing UK tourism data."
  },
  listening: {
    lessons: [
      { id: "l1", title: "Section Types Overview", content: "Section 1 is a social conversation (e.g. booking). Section 2 is a social monologue. Section 3 is an academic discussion. Section 4 is an academic lecture." },
      { id: "l2", title: "Note Completion Strategies", content: "Read the instructions carefully to check the word limit (e.g. 'NO MORE THAN TWO WORDS'). Predict the type of word needed (noun, verb, number) before listening." },
      { id: "l3", title: "Multiple Choice Listening", content: "Underline keywords in the questions before the audio starts. Beware of distractors—speakers often mention all options but correct themselves." }
    ],
    quiz: [
      { id: "lq1", question: "Which section is usually an academic lecture?", options: ["Section 1", "Section 2", "Section 3", "Section 4"], answer: 3 },
      { id: "lq2", question: "If the instruction says 'NO MORE THAN TWO WORDS', and you write 'the red car', your answer is:", options: ["Correct", "Incorrect", "Partially correct", "Acceptable"], answer: 1 },
      { id: "lq3", question: "Before the audio starts for multiple choice, you should:", options: ["Relax", "Read the next section", "Underline keywords in questions", "Write down possible answers"], answer: 2 },
      { id: "lq4", question: "What are distractors in listening?", options: ["Background noise", "Other students coughing", "Mentioned options that are not the actual answer", "The speaker's accent"], answer: 2 },
      { id: "lq5", question: "Section 1 usually involves:", options: ["A university lecture", "A discussion between 3 students", "A social conversation/transaction", "A news report"], answer: 2 }
    ],
    assignment: "Listen to the audio description (provided below) and fill in the gaps in the sentences."
  },
  speaking: {
    lessons: [
      { id: "s1", title: "Part 1 – Personal Questions", content: "Give full answers, not just yes/no. Add a reason or an example. Keep a natural, conversational pace and don't memorize entire answers." },
      { id: "s2", title: "Part 2 – Long Turn (Cue Card)", content: "Use the 1-minute prep time to write keywords, not full sentences. Follow the bullet points on the card to structure your 2-minute talk logically." },
      { id: "s3", title: "Part 3 – Discussion", content: "These are abstract, societal questions. Use structures like 'On the one hand... but on the other hand...' to show you can explore different perspectives." }
    ],
    quiz: [
      { id: "sq1", question: "How should you answer Part 1 questions?", options: ["With simple Yes/No", "With a full answer + reason/example", "With a 2-minute speech", "By asking the examiner questions"], answer: 1 },
      { id: "sq2", question: "In Part 2, how long do you have to prepare?", options: ["30 seconds", "1 minute", "2 minutes", "5 minutes"], answer: 1 },
      { id: "sq3", question: "What should you write during Part 2 prep time?", options: ["Full sentences", "Nothing", "Keywords and ideas", "Your entire speech"], answer: 2 },
      { id: "sq4", question: "Part 3 questions are mostly about:", options: ["Your family", "Your hobbies", "Abstract/societal topics", "Describing a picture"], answer: 2 },
      { id: "sq5", question: "If you don't understand a question in Part 3, you should:", options: ["Guess the meaning", "Stay silent", "Ask the examiner to explain/rephrase", "Talk about something else"], answer: 2 }
    ],
    assignment: "Record yourself (or write a response) to this Part 2 cue card: Describe a place you like to visit."
  },
  grammar: {
    lessons: [
      { id: "g1", title: "Tenses in IELTS Writing", content: "Task 1 usually requires past tense for historical data, but present tense for diagrams/processes. Task 2 uses present tense for general truths and past for specific examples." },
      { id: "g2", title: "Conditionals & Modal Verbs", content: "Use conditionals (If..., then...) in Task 2 to explore hypothetical situations. Use modals (could, might, should) to soften claims instead of making absolute statements." },
      { id: "g3", title: "Passive Voice", content: "Passive voice (The data was collected...) is crucial for academic tone, especially in Task 1 processes or when the actor is unknown or unimportant." }
    ],
    quiz: [
      { id: "gq1", question: "For describing historical data in Task 1, which tense is mostly used?", options: ["Present simple", "Past simple", "Future perfect", "Present continuous"], answer: 1 },
      { id: "gq2", question: "Why use modal verbs in Task 2?", options: ["To sound angry", "To make absolute claims", "To soften claims (hedging)", "To increase word count"], answer: 2 },
      { id: "gq3", question: "Which sentence is in the passive voice?", options: ["The government built the bridge.", "The bridge was built by the government.", "The government is building the bridge.", "The bridge will fall."], answer: 1 },
      { id: "gq4", question: "Conditionals are useful for:", options: ["Describing a bar chart", "Introducing yourself", "Exploring hypothetical situations in essays", "Asking for directions"], answer: 2 },
      { id: "gq5", question: "To describe a manufacturing process in Task 1, you should mainly use:", options: ["Past continuous", "Present passive", "Future simple", "Past perfect"], answer: 1 }
    ],
    assignment: "Rewrite these 5 sentences using the passive voice."
  },
  vocabulary: {
    lessons: [
      { id: "v1", title: "Academic Word List Essentials", content: "Familiarize yourself with academic verbs (analyze, evaluate, implement) and nouns (methodology, perspective, framework). Don't use overly informal idioms in writing." },
      { id: "v2", title: "Synonyms for Common Words", content: "Instead of repeating 'important', use 'crucial', 'significant', or 'vital'. Instead of 'bad', use 'detrimental' or 'adverse'. Variety is key for Lexical Resource." },
      { id: "v3", title: "Collocations in Context", content: "Learn words that naturally go together (e.g., 'make a decision' not 'do a decision', 'strong accent' not 'heavy accent'). This makes you sound native-like." }
    ],
    quiz: [
      { id: "vq1", question: "Which of these is a good synonym for 'important'?", options: ["Big", "Crucial", "Nice", "Good"], answer: 1 },
      { id: "vq2", question: "What is a collocation?", options: ["A very long word", "Words that naturally go together", "A punctuation mark", "A type of sentence"], answer: 1 },
      { id: "vq3", question: "Which is the correct collocation?", options: ["Do a mistake", "Make a mistake", "Have a mistake", "Take a mistake"], answer: 1 },
      { id: "vq4", question: "In academic writing, you should avoid:", options: ["Passive voice", "Complex sentences", "Overly informal idioms", "Synonyms"], answer: 2 },
      { id: "vq5", question: "To improve Lexical Resource score, you must show:", options: ["Only big words", "Perfect spelling", "A wide range of vocabulary flexibly", "Loud pronunciation"], answer: 2 }
    ],
    assignment: "Use 5 of the vocabulary words from today's lesson in original sentences."
  }
};

export default function Module() {
  const { moduleId } = useParams();
  const { data, updateData } = useIeltsData();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("lessons");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [assignmentText, setAssignmentText] = useState("");
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  if (!moduleId || !MODULE_DATA[moduleId]) {
    return <NotFound />;
  }

  const moduleInfo = MODULES.find(m => m.id === moduleId)!;
  const content = MODULE_DATA[moduleId];
  const progress = data.progress[moduleId] || { lessonsCompleted: [], quizScores: {}, assignmentsSubmitted: [] };

  const handleCompleteLesson = (lessonId: string) => {
    if (progress.lessonsCompleted.includes(lessonId)) return;
    
    updateData((prev) => {
      const newModProgress = {
        ...prev.progress[moduleId],
        lessonsCompleted: [...prev.progress[moduleId].lessonsCompleted, lessonId]
      };
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [moduleId]: newModProgress
        }
      };
    });
    
    toast({
      title: "Lesson Completed",
      description: "Progress saved successfully.",
    });
  };

  const handleQuizSubmit = () => {
    let score = 0;
    content.quiz.forEach(q => {
      if (quizAnswers[q.id] === q.answer) score++;
    });

    updateData((prev) => {
      const newModProgress = {
        ...prev.progress[moduleId],
        quizScores: { ...prev.progress[moduleId].quizScores, "main": score }
      };
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [moduleId]: newModProgress
        }
      };
    });
    setQuizSubmitted(true);
    
    toast({
      title: "Quiz Submitted",
      description: `You scored ${score} out of 5!`,
    });
  };

  const handleAssignmentSubmit = () => {
    if (!assignmentText.trim()) return;
    
    updateData((prev) => {
      const newModProgress = {
        ...prev.progress[moduleId],
        assignmentsSubmitted: ["main"]
      };
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [moduleId]: newModProgress
        }
      };
    });

    toast({
      title: "Assignment Submitted!",
      description: "Your work has been saved for review.",
    });
  };

  const completedLessons = progress.lessonsCompleted.length;
  const hasQuiz = Object.keys(progress.quizScores).length > 0;
  const hasAssignment = progress.assignmentsSubmitted.length > 0;
  const totalCompleted = completedLessons + (hasQuiz ? 1 : 0) + (hasAssignment ? 1 : 0);
  const completionPercentage = (totalCompleted / 5) * 100;
  
  const isModuleComplete = completedLessons === 3;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <moduleInfo.icon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{moduleInfo.name} Module</h1>
          <p className="text-muted-foreground mt-1">Master your {moduleInfo.name.toLowerCase()} skills</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Module Progress</span>
            <span className="font-medium text-primary">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-3" data-testid="module-detail-progress" />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="lessons" data-testid="tab-lessons">Lessons</TabsTrigger>
          <TabsTrigger value="quiz" data-testid="tab-quiz">Quiz</TabsTrigger>
          <TabsTrigger value="assignment" data-testid="tab-assignment">Assignment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lessons" className="space-y-4 mt-6">
          {isModuleComplete && (
            <div className="bg-primary/10 text-primary p-4 rounded-lg flex items-center gap-3">
              <Award className="w-6 h-6" />
              <div>
                <p className="font-bold">Congratulations!</p>
                <p className="text-sm">You've completed all lessons in this module.</p>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {content.lessons.map((lesson, idx) => {
              const isCompleted = progress.lessonsCompleted.includes(lesson.id);
              return (
                <Card key={lesson.id} className={isCompleted ? "border-primary/50 bg-primary/5" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardDescription>Lesson {idx + 1}</CardDescription>
                        <CardTitle className="text-lg mt-1">{lesson.title}</CardTitle>
                      </div>
                      {isCompleted ? (
                        <div className="flex items-center text-primary text-sm font-medium gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Completed
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleCompleteLesson(lesson.id)}
                          data-testid={`btn-complete-${lesson.id}`}
                        >
                          Mark as Complete
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {lesson.content}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Check</CardTitle>
              <CardDescription>Test your understanding of the lesson material.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {hasQuiz && !quizSubmitted ? (
                <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">You've already taken this quiz.</p>
                    <p className="text-sm text-muted-foreground">Score: {progress.quizScores["main"]}/5</p>
                  </div>
                  <Button variant="outline" onClick={() => setQuizSubmitted(true)}>View Results</Button>
                </div>
              ) : (
                <>
                  <div className="space-y-8">
                    {content.quiz.map((q, qIndex) => (
                      <div key={q.id} className="space-y-4">
                        <h4 className="font-medium">
                          {qIndex + 1}. {q.question}
                        </h4>
                        <RadioGroup
                          value={quizAnswers[q.id]?.toString()}
                          onValueChange={(val) => !quizSubmitted && setQuizAnswers(prev => ({...prev, [q.id]: parseInt(val)}))}
                          disabled={quizSubmitted}
                        >
                          <div className="space-y-2">
                            {q.options.map((opt, oIndex) => {
                              const isSelected = quizAnswers[q.id] === oIndex;
                              const isCorrect = q.answer === oIndex;
                              
                              let itemClass = "flex items-center space-x-2 p-3 rounded-md border ";
                              if (quizSubmitted) {
                                if (isCorrect) itemClass += "bg-green-50 dark:bg-green-950/30 border-green-500/50";
                                else if (isSelected) itemClass += "bg-red-50 dark:bg-red-950/30 border-red-500/50";
                                else itemClass += "bg-background border-border opacity-50";
                              } else {
                                itemClass += isSelected ? "bg-primary/5 border-primary/50" : "bg-background border-border hover:bg-accent cursor-pointer";
                              }

                              return (
                                <div key={oIndex} className={itemClass}>
                                  <RadioGroupItem value={oIndex.toString()} id={`${q.id}-${oIndex}`} />
                                  <Label 
                                    htmlFor={`${q.id}-${oIndex}`} 
                                    className={`flex-1 cursor-pointer ${quizSubmitted && isCorrect ? "font-bold text-green-700 dark:text-green-400" : ""} ${quizSubmitted && isSelected && !isCorrect ? "text-red-700 dark:text-red-400" : ""}`}
                                  >
                                    {opt}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                  {!quizSubmitted && (
                    <Button 
                      className="w-full mt-4" 
                      size="lg"
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < 5}
                      data-testid="btn-submit-quiz"
                    >
                      Submit Quiz
                    </Button>
                  )}
                  {quizSubmitted && (
                    <div className="p-4 bg-primary/10 rounded-lg text-center mt-6">
                      <p className="text-xl font-bold">Score: {progress.quizScores["main"]}/5</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Practical Assignment</CardTitle>
              <CardDescription>{content.assignment}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasAssignment ? (
                <div className="p-6 bg-muted rounded-lg text-center space-y-2 border-dashed border-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-green-500" />
                  <p className="font-medium text-lg">Assignment Submitted!</p>
                  <p className="text-sm text-muted-foreground">Great job. Your submission has been saved.</p>
                </div>
              ) : (
                <>
                  <Textarea 
                    placeholder="Write your response here..." 
                    className="min-h-[250px] resize-y"
                    value={assignmentText}
                    onChange={(e) => setAssignmentText(e.target.value)}
                    data-testid="input-assignment"
                  />
                  <Button 
                    onClick={handleAssignmentSubmit} 
                    className="w-full"
                    disabled={!assignmentText.trim()}
                    data-testid="btn-submit-assignment"
                  >
                    Submit Assignment
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
