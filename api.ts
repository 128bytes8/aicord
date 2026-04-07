/*
 * AiCord - AI-powered message generation for Discord
 * Copyright (c) 2026 128bytes
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { settings } from "./settings";

type MultimodalContent =
    | { type: "text"; text: string; }
    | { type: "image_url"; image_url: { url: string; }; };

interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string | MultimodalContent[];
}

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
    error?: {
        message: string;
    };
}

function buildToneInstruction(tone: string): string {
    const toneMap: Record<string, string> = {
        casual: "Use a casual, relaxed, conversational Discord chat style. Lowercase is fine, abbreviations welcome.",
        professional: "Use a professional, business-appropriate, and clear tone. Proper grammar, no slang.",
        friendly: "Use a warm, approachable, and friendly tone. Like texting a good friend.",
        enthusiastic: "Use an energetic, excited, and enthusiastic tone. Show genuine excitement.",
        formal: "Use a formal, proper, and grammatically precise tone. No contractions or slang.",
        humorous: "Use a humorous, witty, and lighthearted tone. Include jokes or playful phrasing.",
        academic: "Use a scholarly, precise, and neutral academic tone. Cite-worthy phrasing.",
        "pro-plus": "Use executive-level confidence with power verbs and decisive, commanding language.",
        troll: "Use a sarcastic, belittling roast style. Drip with condescension and backhanded compliments.",
        bully: "Use playful trash-talk with absurd comparisons and over-the-top insults. Keep it fun.",
        roasting: "Roast with creative mockery, unexpected metaphors, and comedic timing.",
    };
    return toneMap[tone] ?? toneMap.casual;
}

function buildFormattingConstraints(minW: number, maxW: number): string {
    const parts: string[] = [];
    const { useEmojis, useExclamationMarks, useQuestionMarks } = settings.store;

    if (useEmojis) parts.push("Include relevant emojis naturally throughout the message.");
    else parts.push("Do NOT use any emojis whatsoever.");

    if (!useExclamationMarks) parts.push("Do NOT use exclamation marks (!).");
    if (!useQuestionMarks) parts.push("Do NOT use question marks (?).");

    parts.push(`Keep the response between ${minW} and ${maxW} words.`);

    return parts.join(" ");
}

export async function generateMessage(
    topic: string,
    tone?: string,
    wordRange?: { min: number; max: number; }
): Promise<string> {
    const { apiKey, modelName, customPrompt, defaultText } = settings.store;

    if (!apiKey) throw new Error("OpenRouter API key not configured. Set it in the AiCord plugin settings.");

    const activeTone = tone ?? settings.store.defaultTone ?? "casual";
    const minW = wordRange?.min ?? settings.store.minWords;
    const maxW = wordRange?.max ?? settings.store.maxWords;

    const systemPrompt = [
        customPrompt,
        "",
        "CRITICAL RULES:",
        `- You are writing a Discord message about the user's topic. The message MUST directly address and incorporate the specific subject matter the user describes.`,
        `- If the user says "productivity tips for linux users", your output must literally be about productivity tips for linux users — mention specific tools, workflows, or advice.`,
        `- The message should read like a real person typed it in Discord chat. Not robotic, not a summary, not generic filler.`,
        `- ${buildToneInstruction(activeTone)}`,
        `- ${buildFormattingConstraints(minW, maxW)}`,
        `- Output ONLY the Discord message. No quotes, no labels, no "Here's your message:", no meta-commentary. Just the raw message text as it would appear in chat.`,
        defaultText ? `- Naturally incorporate this text: "${defaultText}"` : "",
    ].filter(Boolean).join("\n");

    const userPrompt = `Write a Discord message about: ${topic}`;

    const messages: OpenRouterMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
    ];

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/aicord",
            "X-Title": "AiCord",
        },
        body: JSON.stringify({
            model: modelName,
            messages,
            max_tokens: Math.max(maxW * 6, 512),
            temperature: activeTone === "troll" || activeTone === "bully" || activeTone === "roasting" ? 1.1 : 0.85,
        }),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }

    const data: OpenRouterResponse = await res.json();

    if (data.error) throw new Error(`OpenRouter: ${data.error.message}`);
    if (!data.choices?.[0]?.message?.content) throw new Error("OpenRouter returned an empty response.");

    let output = data.choices[0].message.content.trim();
    output = output.replace(/^["']|["']$/g, "");

    return output;
}

export async function generateReply(
    messageContent: string,
    authorName: string,
    imageUrls: string[] = [],
    toneOverride?: string,
    wordRangeOverride?: { min: number; max: number; },
    customInstructions?: string,
): Promise<string> {
    const { apiKey, modelName, customPrompt, defaultText } = settings.store;
    const activeTone = toneOverride ?? settings.store.defaultTone ?? "casual";

    if (!apiKey) throw new Error("OpenRouter API key not configured. Set it in the AiCord plugin settings.");

    const minW = wordRangeOverride?.min ?? settings.store.minWords;
    const maxW = wordRangeOverride?.max ?? settings.store.maxWords;

    const hasImages = imageUrls.length > 0;

    const systemPrompt = [
        customPrompt,
        "",
        "CRITICAL RULES:",
        `- You are replying to someone's Discord message. Your reply MUST directly engage with what they said.`,
        `- Reference specific things from their message. Agree, disagree, add onto it, joke about it — but make it clear you read and understood their message.`,
        hasImages ? `- The message includes images/video frames. Acknowledge and react to what you see in the visual content naturally, as part of your reply.` : "",
        customInstructions ? `- IMPORTANT USER INSTRUCTION: ${customInstructions}` : "",
        `- Sound like a real person chatting on Discord, not a bot or assistant.`,
        `- ${buildToneInstruction(activeTone)}`,
        `- ${buildFormattingConstraints(minW, maxW)}`,
        `- Output ONLY the reply message. No quotes, no labels, no meta-commentary.`,
        defaultText ? `- Naturally incorporate this text: "${defaultText}"` : "",
    ].filter(Boolean).join("\n");

    const userContent: MultimodalContent[] = [
        { type: "text", text: `Reply to ${authorName}'s message: "${messageContent || "(no text, just media)"}"` },
        ...imageUrls.map(url => ({
            type: "image_url" as const,
            image_url: { url },
        })),
    ];

    const messages: OpenRouterMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: hasImages ? userContent : userContent[0].text },
    ];

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/aicord",
            "X-Title": "AiCord",
        },
        body: JSON.stringify({
            model: modelName,
            messages,
            max_tokens: Math.max(maxW * 6, 512),
            temperature: activeTone === "troll" || activeTone === "bully" || activeTone === "roasting" ? 1.1 : 0.85,
        }),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }

    const data: OpenRouterResponse = await res.json();

    if (data.error) throw new Error(`OpenRouter: ${data.error.message}`);
    if (!data.choices?.[0]?.message?.content) throw new Error("OpenRouter returned an empty response.");

    let output = (data.choices[0].message.content as string).trim();
    output = output.replace(/^["']|["']$/g, "");

    return output;
}

export function getDelayMs(): number {
    const { replyDelay } = settings.store;
    const ranges: Record<string, [number, number]> = {
        none: [0, 0],
        fast: [1000, 3000],
        normal: [3000, 8000],
        slow: [8000, 15000],
    };
    const [min, max] = ranges[replyDelay] ?? [0, 0];
    return min + Math.random() * (max - min);
}
