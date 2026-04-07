/*
 * AiCord - AI-powered message generation for Discord
 * Copyright (c) 2026 128bytes
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const TONES = [
    { label: "Casual", value: "casual", default: true },
    { label: "Professional", value: "professional" },
    { label: "Friendly", value: "friendly" },
    { label: "Enthusiastic", value: "enthusiastic" },
    { label: "Formal", value: "formal" },
    { label: "Humorous", value: "humorous" },
    { label: "Academic", value: "academic" },
    { label: "Pro-Plus", value: "pro-plus" },
    { label: "Troll", value: "troll" },
    { label: "Bully", value: "bully" },
    { label: "Roasting", value: "roasting" },
] as const;

export const settings = definePluginSettings({
    apiKey: {
        type: OptionType.STRING,
        description: "Your OpenRouter API key",
        default: "",
        placeholder: "sk-or-v1-...",
    },
    modelName: {
        type: OptionType.STRING,
        description: "OpenRouter model identifier (e.g. x-ai/grok-4.20)",
        default: "openai/gpt-4o-mini",
        placeholder: "openai/gpt-4o-mini",
    },
    customPrompt: {
        type: OptionType.STRING,
        description: "Custom system prompt prepended to every AI request",
        default: "You are a helpful Discord chat assistant. Generate natural, conversational messages. Only output the message text, no quotes or meta-commentary.",
        multiline: true,
    },
    defaultTone: {
        type: OptionType.SELECT,
        description: "Default writing tone for generated messages",
        options: [...TONES],
    },
    useEmojis: {
        type: OptionType.BOOLEAN,
        description: "Include emojis in generated responses",
        default: false,
    },
    useExclamationMarks: {
        type: OptionType.BOOLEAN,
        description: "Allow exclamation marks (!) in generated responses",
        default: true,
    },
    useQuestionMarks: {
        type: OptionType.BOOLEAN,
        description: "Allow question marks (?) in generated responses",
        default: true,
    },
    minWords: {
        type: OptionType.NUMBER,
        description: "Minimum word count for generated messages",
        default: 5,
    },
    maxWords: {
        type: OptionType.NUMBER,
        description: "Maximum word count for generated messages",
        default: 50,
    },
    defaultText: {
        type: OptionType.STRING,
        description: "Default text included in every generated reply (optional)",
        default: "",
        placeholder: "Enter default text to include in replies...",
    },
    replyDelay: {
        type: OptionType.SELECT,
        description: "Simulated delay before sending an AI-generated reply",
        options: [
            { label: "None (instant)", value: "none", default: true },
            { label: "1-3 seconds (Fast)", value: "fast" },
            { label: "3-8 seconds (Normal)", value: "normal" },
            { label: "8-15 seconds (Slow)", value: "slow" },
        ],
    },
    typingIndicator: {
        type: OptionType.BOOLEAN,
        description: "Show typing indicator while generating a reply",
        default: true,
    },
});
