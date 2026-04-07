/*
 * AiCord - AI-powered message generation for Discord
 * Copyright (c) 2026 128bytes
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { sendMessage } from "@utils/discord";
import { openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Message } from "@vencord/discord-types";
import { ChannelStore, Menu, MessageStore, Toasts } from "@webpack/common";

import { generateReply, getDelayMs } from "./api";
import type { ConversationMessage } from "./api";
import { AiCordChatBarIcon } from "./components/AiCordChatBarButton";
import { AiCordIcon, AiCordPlusIcon } from "./components/AiCordIcon";
import { CustomReplyModal } from "./components/CustomReplyModal";
import { settings } from "./settings";
import { extractVideoUrls, extractVideoFrames } from "./videoFrames";

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i;

function extractImageUrls(message: Message): string[] {
    const urls: string[] = [];

    const attachments = (message as any).attachments;
    if (attachments?.length) {
        for (const att of attachments) {
            if (att.content_type?.startsWith("image/") || IMAGE_EXTENSIONS.test(att.url ?? "")) {
                urls.push(att.url);
            }
        }
    }

    const embeds = (message as any).embeds;
    if (embeds?.length) {
        for (const embed of embeds) {
            if (embed.image?.url) urls.push(embed.image.url);
            if (embed.thumbnail?.url) urls.push(embed.thumbnail.url);
        }
    }

    return urls;
}

function hasAnyContent(message: Message): boolean {
    return !!(message.content || extractImageUrls(message).length > 0 || extractVideoUrls(message).length > 0);
}

async function gatherAllMediaUrls(message: Message): Promise<string[]> {
    const imageUrls = extractImageUrls(message);
    const videoUrls = extractVideoUrls(message);

    let videoFrames: string[] = [];
    if (videoUrls.length > 0) {
        for (const vUrl of videoUrls) {
            try {
                const frames = await extractVideoFrames(vUrl);
                videoFrames.push(...frames);
            } catch (e: any) {
                console.warn("[AiCord] Failed to extract video frames:", e.message);
            }
        }
    }

    return [...imageUrls, ...videoFrames];
}

const MAX_CHAIN_DEPTH = 15;
const SURROUNDING_MESSAGES = 5;

function gatherConversationContext(message: Message): ConversationMessage[] {
    const channelMessages = MessageStore.getMessages(message.channel_id);
    if (!channelMessages) return [];

    const allMessages: Message[] = channelMessages._array ?? [];
    if (allMessages.length === 0) return [];

    const replyChain: Message[] = [];
    const visited = new Set<string>();
    let current: Message | undefined = message;

    while (current && replyChain.length < MAX_CHAIN_DEPTH) {
        if (visited.has(current.id)) break;
        visited.add(current.id);
        replyChain.unshift(current);

        const refId = (current as any).messageReference?.message_id;
        if (!refId) break;
        current = allMessages.find(m => m.id === refId);
    }

    const targetIdx = allMessages.findIndex(m => m.id === message.id);

    if (replyChain.length <= 1 && targetIdx > 0) {
        const startIdx = Math.max(0, targetIdx - SURROUNDING_MESSAGES);
        const surrounding = allMessages.slice(startIdx, targetIdx + 1);
        const contextMessages: ConversationMessage[] = [];
        for (const msg of surrounding) {
            if (visited.has(msg.id)) continue;
            contextMessages.push({
                author: (msg.author as any)?.username ?? "unknown",
                content: msg.content || "(media)",
                isTarget: msg.id === message.id,
            });
        }
        return contextMessages;
    }

    return replyChain.map(msg => ({
        author: (msg.author as any)?.username ?? "unknown",
        content: msg.content || "(media)",
        isTarget: msg.id === message.id,
    }));
}

async function handleAiReply(message: Message) {
    const channelId = message.channel_id;
    if (!channelId) return;

    const content = message.content;
    const videoUrls = extractVideoUrls(message);
    const hasVideo = videoUrls.length > 0;

    if (!hasAnyContent(message)) {
        Toasts.show({
            id: Toasts.genId(),
            message: "That message has no text, images, or video to reply to.",
            type: Toasts.Type.FAILURE,
        });
        return;
    }

    const authorName = (message.author as any)?.username ?? "someone";

    Toasts.show({
        id: Toasts.genId(),
        message: hasVideo
            ? "Extracting video frames & generating AI reply..."
            : "Generating AI reply...",
        type: Toasts.Type.MESSAGE,
    });

    try {
        const allMediaUrls = await gatherAllMediaUrls(message);
        const context = gatherConversationContext(message);
        const reply = await generateReply(content, authorName, allMediaUrls, undefined, undefined, undefined, context);
        const delay = getDelayMs();

        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        sendMessage(channelId, { content: reply }, true, {
            messageReference: {
                channel_id: channelId,
                message_id: message.id,
                guild_id: (message as any).guild_id,
            },
        });

        Toasts.show({
            id: Toasts.genId(),
            message: "AI reply sent!",
            type: Toasts.Type.SUCCESS,
        });
    } catch (e: any) {
        Toasts.show({
            id: Toasts.genId(),
            message: `AI reply failed: ${e.message}`,
            type: Toasts.Type.FAILURE,
        });
    }
}

function openCustomReplyModal(message: Message) {
    const channelId = message.channel_id;
    const authorName = (message.author as any)?.username ?? "someone";

    Toasts.show({
        id: Toasts.genId(),
        message: extractVideoUrls(message).length > 0
            ? "Extracting video frames..."
            : "Preparing...",
        type: Toasts.Type.MESSAGE,
    });

    const context = gatherConversationContext(message);

    gatherAllMediaUrls(message).then(allMediaUrls => {
        openModal(props => (
            <CustomReplyModal
                rootProps={props}
                messageContent={message.content}
                authorName={authorName}
                imageUrls={allMediaUrls}
                conversationContext={context}
                onGenerated={(text: string) => {
                    sendMessage(channelId, { content: text }, true, {
                        messageReference: {
                            channel_id: channelId,
                            message_id: message.id,
                            guild_id: (message as any).guild_id,
                        },
                    });
                    Toasts.show({
                        id: Toasts.genId(),
                        message: "AI reply sent!",
                        type: Toasts.Type.SUCCESS,
                    });
                }}
            />
        ));
    }).catch(() => {
        openModal(props => (
            <CustomReplyModal
                rootProps={props}
                messageContent={message.content}
                authorName={authorName}
                imageUrls={extractImageUrls(message)}
                conversationContext={context}
                onGenerated={(text: string) => {
                    sendMessage(channelId, { content: text }, true, {
                        messageReference: {
                            channel_id: channelId,
                            message_id: message.id,
                            guild_id: (message as any).guild_id,
                        },
                    });
                    Toasts.show({
                        id: Toasts.genId(),
                        message: "AI reply sent!",
                        type: Toasts.Type.SUCCESS,
                    });
                }}
            />
        ));
    });
}

const messageCtxPatch: NavContextMenuPatchCallback = (children, { message }: { message: Message; }) => {
    if (!hasAnyContent(message)) return;

    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;

    const idx = group.findIndex(c => c?.props?.id === "copy-text") + 1;

    group.splice(idx, 0,
        <Menu.MenuItem
            id="vc-aicord-reply"
            label="Reply with AI"
            icon={AiCordIcon}
            action={() => handleAiReply(message)}
        />,
        <Menu.MenuItem
            id="vc-aicord-reply-custom"
            label="Reply with AI+"
            icon={AiCordPlusIcon}
            action={() => openCustomReplyModal(message)}
        />
    );
};

export default definePlugin({
    name: "AiCord",
    description: "Generate AI-powered messages and replies using OpenRouter. Adds a chat bar button and context menu option.",
    authors: [{ name: "128bytes", id: 0n }],
    settings,

    contextMenus: {
        "message": messageCtxPatch,
    },

    chatBarButton: {
        icon: AiCordIcon,
        render: AiCordChatBarIcon,
    },

    messagePopoverButton: {
        icon: AiCordIcon,
        render(message: Message) {
            if (!hasAnyContent(message)) return null;

            return {
                label: "Reply with AI",
                icon: AiCordIcon,
                message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: () => handleAiReply(message),
            };
        },
    },
});
