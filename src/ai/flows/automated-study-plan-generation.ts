'use server';

/**
 * @fileOverview Generates a personalized daily study plan based on input subjects and available time.
 *
 * - generateStudyPlan - A function that generates the study plan.
 * - StudyPlanInput - The input type for the generateStudyPlan function.
 * - StudyPlanOutput - The return type for the generateStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudyPlanInputSchema = z.object({
  subjects: z
    .array(z.string())
    .describe('List of subjects to study.'),
  availableTime: z
    .number()
    .describe('Total available study time in minutes.'),
});
export type StudyPlanInput = z.infer<typeof StudyPlanInputSchema>;

const StudyPlanOutputSchema = z.object({
  plan: z
    .array(
      z.object({
        subject: z.string().describe('The subject for this study session.'),
        duration: z
          .number()
          .describe('The duration of the study session in minutes.'),
        task: z
          .string()
          .optional()
          .describe('Optional task associated with subject, ex: read chapter 1.'),
      })
    )
    .describe('The generated daily study plan.'),
});
export type StudyPlanOutput = z.infer<typeof StudyPlanOutputSchema>;

export async function generateStudyPlan(
  input: StudyPlanInput
): Promise<StudyPlanOutput> {
  return generateStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  input: {schema: StudyPlanInputSchema},
  output: {schema: StudyPlanOutputSchema},
  prompt: `You are an AI study plan generator. You will take in subjects and available study time and provide a daily study plan that maximizes learning effectiveness. Consider the Pomodoro technique and other effective studying methods. Break down each subject into smaller tasks.

Subjects: {{subjects}}
Available Study Time (minutes): {{availableTime}}

Output the study plan in JSON format:

`,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: StudyPlanInputSchema,
    outputSchema: StudyPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
