"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCw, Forward } from 'lucide-react';

type Task = {
  subject: string;
  duration: number; // in minutes
  task?: string;
};

const formatTime = (seconds: number): string => {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function Timer({ task, onComplete, onSelectTask }: { task: Task | null; onComplete: () => void; onSelectTask: (task: Task) => void }) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    
    const initialDurationSeconds = useMemo(() => (task ? task.duration * 60 : 0), [task]);

    useEffect(() => {
        setTimeLeft(initialDurationSeconds);
        setIsRunning(false);
    }, [initialDurationSeconds]);

    useEffect(() => {
        if (!isRunning || timeLeft <= 0) {
            if (timeLeft <= 0 && isRunning) {
                onComplete();
                setIsRunning(false);
            }
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, timeLeft, onComplete]);

    const toggleTimer = useCallback(() => {
        if (timeLeft > 0) {
            setIsRunning(prev => !prev);
        }
    }, [timeLeft]);
    
    const resetTimer = useCallback(() => {
        setTimeLeft(initialDurationSeconds);
        setIsRunning(false);
    }, [initialDurationSeconds]);

    const skipTask = useCallback(() => {
        if (task) {
            onComplete();
        }
    }, [task, onComplete]);

    const progress = initialDurationSeconds > 0 ? (timeLeft / initialDurationSeconds) : 0;
    const circumference = 2 * Math.PI * 42;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <Card className="w-full max-w-sm mx-auto text-center shadow-lg border-2 border-transparent hover:border-primary/20 transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold truncate">{task?.subject || 'No Task Selected'}</CardTitle>
                <CardDescription className="h-5">{task?.task || 'Select a task to begin'}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pt-4">
                <div className="relative h-52 w-52 sm:h-60 sm:w-60">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                            className="stroke-current text-gray-200/80 dark:text-gray-700/50"
                            strokeWidth="5"
                            cx="50"
                            cy="50"
                            r="42"
                            fill="transparent"
                        />
                        <circle
                            className="stroke-current text-primary"
                            strokeWidth="5"
                            cx="50"
                            cy="50"
                            r="42"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-mono font-bold text-foreground">
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button onClick={toggleTimer} size="lg" className="w-32" disabled={!task}>
                        {isRunning ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                        {isRunning ? 'Pause' : 'Start'}
                    </Button>
                    <Button onClick={resetTimer} size="icon" variant="outline" disabled={!task} aria-label="Reset Timer">
                        <RotateCw />
                    </Button>
                </div>
            </CardContent>
             <CardFooter className="flex justify-center pb-4">
                <Button onClick={skipTask} variant="ghost" size="sm" disabled={!task}>
                    <Forward className="mr-2 h-4 w-4" />
                    Skip Task
                </Button>
             </CardFooter>
        </Card>
    );
}
