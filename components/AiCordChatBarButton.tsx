/*
 * AiCord - AI-powered message generation for Discord
 * Copyright (c) 2026 128bytes
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { sendMessage } from "@utils/discord";
import { openModal } from "@utils/modal";
import { SelectedChannelStore } from "@webpack/common";

import { cl } from "../utils";
import { AiCordIcon } from "./AiCordIcon";
import { GenerateModal } from "./GenerateModal";

export const AiCordChatBarIcon: ChatBarButtonFactory = ({ isMainChat }) => {
    if (!isMainChat) return null;

    const handleGenerated = (text: string) => {
        const channelId = SelectedChannelStore.getChannelId();
        if (channelId && text) {
            sendMessage(channelId, { content: text });
        }
    };

    return (
        <ChatBarButton
            tooltip="Generate AI Message"
            onClick={() => {
                openModal(props => (
                    <GenerateModal rootProps={props} onGenerated={handleGenerated} />
                ));
            }}
            buttonProps={{ "aria-haspopup": "dialog" }}
        >
            <AiCordIcon className={cl("chat-button")} />
        </ChatBarButton>
    );
};
