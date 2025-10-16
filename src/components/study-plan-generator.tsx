"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from 'lucide-react';
import { generatePlanAction } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";
import type { StudyPlanOutput } from '@/ai/flows/automated-study-plan-generation';

const formSchema = z.object({
    subjects: z.string().min(3, { message: "Please enter at least one subject." }),
    availableTime: z.coerce.number().min(10, { message: "Please enter at least 10 minutes." }),
});

type StudyPlanGeneratorProps = {
    onPlanGenerated: (plan: StudyPlanOutput['plan']) => void;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
}

export function StudyPlanGenerator({ onPlanGenerated, isLoading, setIsLoading }: StudyPlanGeneratorProps) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subjects: "",
            availableTime: 60,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        const subjectsArray = values.subjects.split(',').map(s => s.trim()).filter(Boolean);
        
        const result = await generatePlanAction({
            subjects: subjectsArray,
            availableTime: values.availableTime,
        });

        if (result.success && result.data) {
            onPlanGenerated(result.data.plan);
            toast({
                title: "Study Plan Generated!",
                description: "Your personalized study plan is ready.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Oh no! Something went wrong.",
                description: result.error || "Failed to generate study plan.",
            });
        }
        setIsLoading(false);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Automated Study Plan</CardTitle>
                <CardDescription>Let AI create a focused study plan for you based on effective learning strategies.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="subjects"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subjects (comma-separated)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g., Math, History, Chemistry" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="availableTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Available Time (minutes)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Generate Plan
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
