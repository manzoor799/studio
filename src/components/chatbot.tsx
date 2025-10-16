
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { chatAction } from "@/lib/actions";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";

const chatSchema = z.object({
  query: z.string().min(1, "Please enter a question."),
});

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof chatSchema>>({
    resolver: zodResolver(chatSchema),
    defaultValues: { query: "" },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth",
        });
    }
  }, [messages]);


  async function onSubmit(values: z.infer<typeof chatSchema>) {
    setIsLoading(true);
    const userMessage: Message = { role: "user", content: values.query };
    setMessages((prev) => [...prev, userMessage]);
    form.reset();

    const result = await chatAction({ query: values.query });

    if (result.success && result.data) {
      const assistantMessage: Message = { role: "assistant", content: result.data.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: result.error || "Failed to get a response.",
      });
      setMessages(prev => prev.slice(0, prev.length - 1));
    }
    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <CardTitle>Study Assistant</CardTitle>
        </div>
        <CardDescription>Ask any question about your subjects, and I'll help you out!</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 pr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("p-3 rounded-lg max-w-sm", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-accent')}>
                  <p className="text-sm">{message.content}</p>
                </div>
                 {message.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
                 <div className="flex items-start gap-3 justify-start">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                    <div className="p-3 rounded-lg bg-accent flex items-center">
                        <Loader2 className="w-5 h-5 animate-spin"/>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input placeholder="e.g., What is grammar?" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
