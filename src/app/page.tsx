
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
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

import { Timer } from "@/components/timer";
import { StudyPlanGenerator } from "@/components/study-plan-generator";
import { Logo } from "@/components/icons";
import { BookOpen, History, ListTodo, Play, Plus, Trash2, Pencil, Check as CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Task = {
  id: number;
  subject: string;
  duration: number; // in minutes
  task?: string;
  completed: boolean;
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
  const [studyPlan, setStudyPlan] = useState<Task[] | null>(null);
  const [sessionLog, setSessionLog] = useState<LogEntry[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});


  useEffect(() => {
    setIsClient(true);
  }, []);

  const quickTaskForm = useForm<z.infer<typeof quickTaskSchema>>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: { subject: "", duration: 25 },
  });

  const handlePlanGenerated = (plan: StudyPlanOutput["plan"]) => {
    const planWithState = plan.map((task, index) => ({
      ...task,
      id: Date.now() + index, // More robust ID
      completed: false,
    }));
    setStudyPlan(planWithState);
    setCurrentTask(null);
  };

  const handleTaskComplete = useCallback(() => {
    if (currentTask) {
      const newLogEntry = {
        subject: currentTask.subject,
        task: currentTask.task,
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessionLog(prevLog => [newLogEntry, ...prevLog]);
      
      setStudyPlan(prevPlan => 
        prevPlan ? prevPlan.map(task => 
          task.id === currentTask.id ? { ...task, completed: true } : task
        ) : null
      );

      setCurrentTask(null);
      toast({
        title: "Task Completed!",
        description: `Great job on finishing "${currentTask.subject}".`,
      });
    }
  }, [currentTask, toast]);

  const handleSelectTask = (task: Task) => {
    if (!task.completed) {
      setCurrentTask(task);
    }
  };

  function onQuickTaskSubmit(values: z.infer<typeof quickTaskSchema>) {
    const newQuickTask: Task = {
      id: Date.now(),
      subject: values.subject,
      duration: values.duration,
      task: "Quick Task",
      completed: false
    };
    // Add to study plan to be displayed in the checklist as well
    setStudyPlan(prevPlan => [newQuickTask, ...(prevPlan || [])]);
    handleSelectTask(newQuickTask);
    quickTaskForm.reset();
  }

  const handleDurationChange = (taskId: number, newDuration: number) => {
    setStudyPlan(prevPlan => 
      prevPlan ? prevPlan.map(task =>
        task.id === taskId ? { ...task, duration: newDuration } : task
      ) : null
    );
    if (currentTask && currentTask.id === taskId) {
      setCurrentTask(prev => prev ? { ...prev, duration: newDuration } : null);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    setStudyPlan(prevPlan => prevPlan ? prevPlan.filter(task => task.id !== taskId) : null);
    if (currentTask && currentTask.id === taskId) {
      setCurrentTask(null);
    }
    toast({
      title: "Task Removed",
      description: "The task has been deleted from your plan.",
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditedTask({ subject: task.subject, task: task.task });
  };

  const handleSaveEdit = (taskId: number) => {
    setStudyPlan(prevPlan => 
      prevPlan ? prevPlan.map(task =>
        task.id === taskId ? { ...task, ...editedTask } : task
      ) : null
    );
    if (currentTask && currentTask.id === taskId) {
      setCurrentTask(prev => prev ? { ...prev, ...editedTask } : null);
    }
    setEditingTaskId(null);
    setEditedTask({});
    toast({
      title: "Task Updated",
      description: "Your changes have been saved.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <header className="flex items-center gap-3 mb-8">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">StudyFlow</h1>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="lg:order-last">
            <Timer task={currentTask} onComplete={handleTaskComplete} onSelectTask={handleSelectTask} />
          </div>
          <div className="w-full lg:order-first">
            <Tabs defaultValue="ai-plan" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ai-plan"><BookOpen className="w-4 h-4 mr-2" />AI Plan</TabsTrigger>
                <TabsTrigger value="quick-task"><Plus className="w-4 h-4 mr-2" />Quick Task</TabsTrigger>
                <TabsTrigger value="session-log"><History className="w-4 h-4 mr-2" />Log</TabsTrigger>
              </TabsList>

              <TabsContent value="ai-plan">
                <StudyPlanGenerator onPlanGenerated={handlePlanGenerated} isLoading={isLoadingPlan} setIsLoading={setIsLoadingPlan} />
                {studyPlan && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><ListTodo /> Your Study Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-72">
                        <div className="space-y-4">
                          {studyPlan.map((item) => (
                            <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${item.completed ? 'bg-accent/30' : 'bg-accent/50 hover:bg-accent/60'}`}>
                              <div className="flex items-start gap-4 flex-grow">
                                <Checkbox checked={item.completed} className="mt-1" onCheckedChange={() => handleSelectTask(item)} disabled={item.completed} />
                                <div className="flex-grow">
                                  {editingTaskId === item.id ? (
                                    <div className="flex flex-col gap-2">
                                      <Input
                                        value={editedTask.subject}
                                        onChange={(e) => setEditedTask(prev => ({ ...prev, subject: e.target.value }))}
                                        className="h-8 text-sm"
                                      />
                                      <Input
                                        value={editedTask.task}
                                        onChange={(e) => setEditedTask(prev => ({ ...prev, task: e.target.value }))}
                                        className="h-8 text-xs"
                                        placeholder="Task description..."
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <p className={`font-semibold ${item.completed ? 'line-through text-muted-foreground' : ''}`}>{item.subject}</p>
                                      <p className="text-sm text-muted-foreground">{item.task}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="flex items-center gap-2 w-32">
                                  <Slider
                                    value={[item.duration]}
                                    max={120}
                                    step={5}
                                    onValueChange={([value]) => handleDurationChange(item.id, value)}
                                    disabled={item.completed}
                                    className="w-full"
                                  />
                                  <span className="text-sm font-normal text-muted-foreground w-12 text-right">{item.duration}m</span>
                                </div>
                                {editingTaskId === item.id ? (
                                    <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(item.id)}><CheckIcon className="w-4 h-4 text-green-500"/></Button>
                                ) : (
                                    <>
                                        <Button size="icon" variant="ghost" onClick={() => handleSelectTask(item)} disabled={item.completed}><Play className="w-4 h-4" /></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleEditTask(item)} disabled={item.completed}><Pencil className="w-4 h-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteTask(item.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                    </>
                                )}
                              </div>
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
        <footer className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            Developed by Manzoor | Visit <a href="https://manzoorseo.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">manzoorseo.com</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
