/*
 * AiCord - AI-powered message generation for Discord
 * Copyright (c) 2026 128bytes
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { HeadingPrimary } from "@components/Heading";
import { Margins } from "@utils/margins";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, ModalSize } from "@utils/modal";
import { Button, Text, TextArea, TextInput, useState } from "@webpack/common";

import { generateMessage } from "../api";
import { TONES } from "../settings";
import { cl } from "../utils";
import { SparkleIcon } from "./AiCordIcon";

interface GenerateModalProps {
    rootProps: ModalProps;
    onGenerated: (text: string) => void;
}

export function GenerateModal({ rootProps, onGenerated }: GenerateModalProps) {
    const [topic, setTopic] = useState("");
    const [selectedTone, setSelectedTone] = useState("casual");
    const [minWords, setMinWords] = useState(10);
    const [maxWords, setMaxWords] = useState(30);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setLoading(true);
        setError(null);
        setPreview(null);
        try {
            const result = await generateMessage(topic, selectedTone, { min: minWords, max: maxWords });
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
                    <SparkleIcon className={cl("sparkle")} /> Generate Message
                </HeadingPrimary>
                <ModalCloseButton onClick={rootProps.onClose} />
            </ModalHeader>

            <ModalContent className={cl("modal-content")}>
                <div className={cl("field")}>
                    <Text variant="text-xs/semibold" className={cl("label")}>
                        What's your message about?
                    </Text>
                    <TextArea
                        value={topic}
                        onChange={setTopic}
                        placeholder="e.g., 'productivity tips for developers'"
                        rows={3}
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
                                Send Message
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            color={Button.Colors?.BRAND}
                            size={Button.Sizes?.MEDIUM}
                            disabled={loading || !topic.trim()}
                        >
                            {loading ? "Generating..." : "Generate Message"}
                        </Button>
                    )}
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}
