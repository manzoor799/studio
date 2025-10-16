"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { StudyPlanOutput } from "@/ai/flows/automated-study-plan-generation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { Timer } from "@/components/timer";
import { StudyPlanGenerator } from "@/components/study-plan-generator";
import { Logo } from "@/components/icons";
import { BookOpen, History, ListTodo, Play, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Task = {
  subject: string;
  duration: number; // in minutes
  task?: string;
};

type LogEntry = {
  subject: string;
  task?: string;
  completedAt: string;
};

const quickTaskSchema = z.object({
  subject: z.string().min(1, "Task name is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
});

export default function Home() {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlanOutput["plan"] | null>(null);
  const [sessionLog, setSessionLog] = useState<LogEntry[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const quickTaskForm = useForm<z.infer<typeof quickTaskSchema>>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: { subject: "", duration: 25 },
  });

  const handleTaskComplete = useCallback(() => {
    if (currentTask) {
      const newLogEntry = {
        subject: currentTask.subject,
        task: currentTask.task,
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessionLog(prevLog => [newLogEntry, ...prevLog]);
      setCurrentTask(null);
      toast({
        title: "Task Completed!",
        description: `Great job on finishing "${currentTask.subject}".`,
      });
    }
  }, [currentTask, toast]);

  const handleSelectTask = (task: Task) => {
    setCurrentTask(task);
  };

  function onQuickTaskSubmit(values: z.infer<typeof quickTaskSchema>) {
    handleSelectTask({ subject: values.subject, duration: values.duration, task: "Quick Task" });
    quickTaskForm.reset();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <header className="flex items-center gap-3 mb-8">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">StudyFlow</h1>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex justify-center items-start">
            <Timer task={currentTask} onComplete={handleTaskComplete} onSelectTask={handleSelectTask} />
          </div>

          <div className="w-full">
            <Tabs defaultValue="ai-plan" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ai-plan"><BookOpen className="w-4 h-4 mr-2" />AI Plan</TabsTrigger>
                <TabsTrigger value="quick-task"><Plus className="w-4 h-4 mr-2" />Quick Task</TabsTrigger>
                <TabsTrigger value="session-log"><History className="w-4 h-4 mr-2" />Log</TabsTrigger>
              </TabsList>

              <TabsContent value="ai-plan">
                <StudyPlanGenerator onPlanGenerated={setStudyPlan} isLoading={isLoadingPlan} setIsLoading={setIsLoadingPlan} />
                {studyPlan && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><ListTodo /> Your Study Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-4">
                          {studyPlan.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                              <div>
                                <p className="font-semibold">{item.subject} <span className="text-sm font-normal text-muted-foreground">({item.duration} min)</span></p>
                                <p className="text-sm text-muted-foreground">{item.task}</p>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => handleSelectTask(item)}>
                                <Play className="w-4 h-4 mr-2" /> Start
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="quick-task">
                <Card>
                  <CardHeader>
                    <CardTitle>Create a Quick Task</CardTitle>
                    <CardDescription>Add a one-off task to your session.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...quickTaskForm}>
                      <form onSubmit={quickTaskForm.handleSubmit(onQuickTaskSubmit)} className="space-y-4">
                        <FormField control={quickTaskForm.control} name="subject" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Task Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Review Chapter 5" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={quickTaskForm.control} name="duration" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl><Input type="number" placeholder="25" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="submit" className="w-full">
                          <Play className="w-4 h-4 mr-2" /> Start Task
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="session-log">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Log</CardTitle>
                    <CardDescription>A record of your completed tasks.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[26rem]">
                      {sessionLog.length > 0 ? (
                        <div className="space-y-4">
                          {sessionLog.map((entry, index) => (
                            <div key={index}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold">{entry.subject}</p>
                                  <p className="text-sm text-muted-foreground">{entry.task}</p>
                                </div>
                                {isClient && <p className="text-sm text-muted-foreground">{entry.completedAt}</p>}
                              </div>
                              {index < sessionLog.length - 1 && <Separator className="mt-4" />}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-12">
                          <p>No tasks completed yet.</p>
                          <p>Finish a task to see it here!</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
