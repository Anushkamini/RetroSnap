// 'use server';
/**
 * @fileOverview This file defines a Genkit flow for applying a dreamy aesthetic to a photo.
 *
 * - dreamifyPhoto - The main function that takes a photo and returns a dreamified version.
 * - DreamifyPhotoInput - The input type for the dreamifyPhoto function.
 * - DreamifyPhotoOutput - The output type for the dreamifyPhoto function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DreamifyPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo to dreamify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type DreamifyPhotoInput = z.infer<typeof DreamifyPhotoInputSchema>;

const DreamifyPhotoOutputSchema = z.object({
  dreamifiedPhotoDataUri: z
    .string()
    .describe(
      'The dreamified photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type DreamifyPhotoOutput = z.infer<typeof DreamifyPhotoOutputSchema>;

export async function dreamifyPhoto(input: DreamifyPhotoInput): Promise<DreamifyPhotoOutput> {
  return dreamifyPhotoFlow(input);
}

const dreamifyPhotoPrompt = ai.definePrompt({
  name: 'dreamifyPhotoPrompt',
  input: {schema: DreamifyPhotoInputSchema},
  output: {schema: DreamifyPhotoOutputSchema},
  prompt: `You are an AI photo editor specializing in applying dreamy aesthetics to photos.

You will analyze the input photo and adjust various parameters such as color balance, blurring, and lighting to mimic a dreamy aesthetic.

Return the dreamified photo as a data URI.

Input Photo: {{media url=photoDataUri}}

Output Format: data:<mimetype>;base64,<encoded_data>`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const dreamifyPhotoFlow = ai.defineFlow(
  {
    name: 'dreamifyPhotoFlow',
    inputSchema: DreamifyPhotoInputSchema,
    outputSchema: DreamifyPhotoOutputSchema,
  },
  async input => {
    const {output} = await dreamifyPhotoPrompt(input);
    return output!;
  }
);
