"use server";

import { z } from 'zod';
import { generateStudyPlan, type StudyPlanInput, type StudyPlanOutput } from '@/ai/flows/automated-study-plan-generation';
import { chat, type ChatInput, type ChatOutput } from '@/ai/flows/chatbot';

const studyPlanActionSchema = z.object({
  subjects: z.array(z.string()).min(1, "At least one subject is required."),
  availableTime: z.number().min(1, "Available time must be at least 1 minute."),
});

type StudyPlanActionResult = {
  success: boolean;
  data?: StudyPlanOutput;
  error?: string;
};

export async function generatePlanAction(input: StudyPlanInput): Promise<StudyPlanActionResult> {
  const validation = studyPlanActionSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(' ') };
  }

  try {
    const plan = await generateStudyPlan(validation.data);
    if (!plan || !plan.plan || plan.plan.length === 0) {
      return { success: false, error: "AI could not generate a plan. Try different inputs." };
    }
    return { success: true, data: plan };
  } catch (error) {
    console.error("Error generating study plan:", error);
    return { success: false, error: "An unexpected error occurred while communicating with the AI. Please try again later." };
  }
}


const chatActionSchema = z.object({
    query: z.string().min(1, "Query cannot be empty.")
});

type ChatActionResult = {
  success: boolean;
  data?: ChatOutput;
  error?: string;
};

export async function chatAction(input: ChatInput): Promise<ChatActionResult> {
    const validation = chatActionSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: validation.error.errors.map(e => e.message).join(' ') };
    }
    
    try {
        const response = await chat(validation.data);
        if (!response || !response.answer) {
            return { success: false, error: "AI could not provide an answer. Please try again." };
        }
        return { success: true, data: response };
    } catch (error) {
        console.error("Error in chat action:", error);
        return { success: false, error: "An unexpected error occurred while communicating with the AI." };
    }
}
