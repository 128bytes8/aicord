/*
 * AiCord - AI-powered message generation for Discord
 * Copyright (c) 2026 128bytes
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { HeadingPrimary } from "@components/Heading";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, ModalSize } from "@utils/modal";
import { Button, Text, TextArea, TextInput, useState } from "@webpack/common";

import { generateReply } from "../api";
import type { ConversationMessage } from "../api";
import { TONES } from "../settings";
import { cl } from "../utils";
import { AiCordPlusIcon } from "./AiCordIcon";

interface CustomReplyModalProps {
    rootProps: ModalProps;
    messageContent: string;
    authorName: string;
    imageUrls: string[];
    conversationContext?: ConversationMessage[];
    onGenerated: (text: string) => void;
}

export function CustomReplyModal({ rootProps, messageContent, authorName, imageUrls, conversationContext, onGenerated }: CustomReplyModalProps) {
    const [customInstructions, setCustomInstructions] = useState("");
    const [selectedTone, setSelectedTone] = useState("casual");
    const [minWords, setMinWords] = useState(5);
    const [maxWords, setMaxWords] = useState(50);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const truncatedMsg = messageContent.length > 120
        ? messageContent.slice(0, 120) + "..."
        : messageContent;

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setPreview(null);
        try {
            const result = await generateReply(
                messageContent,
                authorName,
                imageUrls,
                selectedTone,
                { min: minWords, max: maxWords },
                customInstructions || undefined,
                conversationContext ?? [],
            );
            setPreview(result);
        } catch (e: any) {
            setError(e.message ?? "Generation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (preview) {
            onGenerated(preview);
            rootProps.onClose();
        }
    };

    return (
        <ModalRoot {...rootProps} size={ModalSize.MEDIUM}>
            <ModalHeader className={cl("modal-header")}>
                <HeadingPrimary className={cl("modal-title")}>
                    <AiCordPlusIcon height={20} width={20} className={cl("sparkle")} /> Custom AI Reply
                </HeadingPrimary>
                <ModalCloseButton onClick={rootProps.onClose} />
            </ModalHeader>

            <ModalContent className={cl("modal-content")}>
                <div className={cl("field")}>
                    <Text variant="text-xs/semibold" className={cl("label")}>
                        Replying to {authorName}
                    </Text>
                    <div className={cl("quote-box")}>
                        <Text variant="text-sm/normal">
                            {truncatedMsg || "(image/video only)"}
                        </Text>
                        {imageUrls.length > 0 && (
                            <Text variant="text-xs/normal" className={cl("media-tag")}>
                                + {imageUrls.length} media attachment{imageUrls.length > 1 ? "s" : ""}
                            </Text>
                        )}
                        {conversationContext && conversationContext.length > 1 && (
                            <Text variant="text-xs/normal" className={cl("context-tag")}>
                                + {conversationContext.length} messages in thread context
                            </Text>
                        )}
                    </div>
                </div>

                <div className={cl("field")}>
                    <Text variant="text-xs/semibold" className={cl("label")}>
                        How should the AI respond?
                    </Text>
                    <TextArea
                        value={customInstructions}
                        onChange={setCustomInstructions}
                        placeholder="e.g., 'agree enthusiastically', 'ask them to elaborate', 'make a joke about it', 'argue the opposite'..."
                        rows={2}
                        className={cl("topic-input")}
                    />
                </div>

                <div className={cl("field")}>
                    <Text variant="text-xs/semibold" className={cl("label")}>
                        Tone
                    </Text>
                    <div className={cl("tone-grid")}>
                        {TONES.map(t => (
                            <button
                                key={t.value}
                                className={cl("tone-btn", { "tone-active": selectedTone === t.value })}
                                onClick={() => setSelectedTone(t.value)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={cl("field")}>
                    <Text variant="text-xs/semibold" className={cl("label")}>
                        Length
                    </Text>
                    <div className={cl("length-row")}>
                        <TextInput
                            type="number"
                            value={String(minWords)}
                            onChange={v => setMinWords(Math.max(1, parseInt(v) || 1))}
                            className={cl("length-input")}
                        />
                        <span className={cl("length-sep")}>-</span>
                        <TextInput
                            type="number"
                            value={String(maxWords)}
                            onChange={v => setMaxWords(Math.max(minWords, parseInt(v) || minWords))}
                            className={cl("length-input")}
                        />
                        <Text variant="text-xs/normal" className={cl("length-unit")}>words</Text>
                    </div>
                </div>

                {error && (
                    <Text variant="text-sm/normal" className={cl("error")}>
                        {error}
                    </Text>
                )}

                {preview && (
                    <div className={cl("preview")}>
                        <Text variant="text-xs/semibold" className={cl("label")}>
                            Preview
                        </Text>
                        <div className={cl("preview-box")}>
                            <Text variant="text-sm/normal">{preview}</Text>
                        </div>
                    </div>
                )}
            </ModalContent>

            <ModalFooter className={cl("modal-footer")}>
                <div className={cl("footer-buttons")}>
                    <Button
                        onClick={rootProps.onClose}
                        look={Button.Looks?.LINK}
                        color={Button.Colors?.PRIMARY}
                        size={Button.Sizes?.MEDIUM}
                    >
                        Cancel
                    </Button>
                    {preview ? (
                        <>
                            <Button
                                onClick={handleGenerate}
                                look={Button.Looks?.OUTLINED}
                                color={Button.Colors?.PRIMARY}
                                size={Button.Sizes?.MEDIUM}
                                disabled={loading}
                            >
                                Regenerate
                            </Button>
                            <Button
                                onClick={handleSend}
                                color={Button.Colors?.BRAND}
                                size={Button.Sizes?.MEDIUM}
                            >
                                Send Reply
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            color={Button.Colors?.BRAND}
                            size={Button.Sizes?.MEDIUM}
                            disabled={loading}
                        >
                            {loading ? "Generating..." : "Generate Reply"}
                        </Button>
                    )}
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}
