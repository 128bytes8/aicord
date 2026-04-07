/*
 * AiCord - AI-powered message generation for Discord
 * Copyright (c) 2026 128bytes
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classes } from "@utils/misc";
import { IconComponent } from "@utils/types";

export const AiCordIcon: IconComponent = ({ height = 24, width = 24, className }) => (
    <svg
        viewBox="0 0 24 24"
        height={height}
        width={width}
        className={classes("vc-aicord-icon", className)}
        fill="currentColor"
    >
        <path d="M9.5 2l2.3 4.7L16.5 9l-4.7 2.3L9.5 16l-2.3-4.7L2.5 9l4.7-2.3L9.5 2z" />
        <path d="M18 12l1.2 2.8L22 16l-2.8 1.2L18 20l-1.2-2.8L14 16l2.8-1.2L18 12z" />
    </svg>
);

export const SparkleIcon: IconComponent = ({ height = 16, width = 16, className }) => (
    <svg
        viewBox="0 0 24 24"
        height={height}
        width={width}
        className={className}
        fill="currentColor"
    >
        <path d="M9.5 2l2.3 4.7L16.5 9l-4.7 2.3L9.5 16l-2.3-4.7L2.5 9l4.7-2.3L9.5 2z" />
        <path d="M18 12l1.2 2.8L22 16l-2.8 1.2L18 20l-1.2-2.8L14 16l2.8-1.2L18 12z" />
    </svg>
);

export const AiCordPlusIcon: IconComponent = ({ height = 24, width = 24, className }) => (
    <svg
        viewBox="0 0 24 24"
        height={height}
        width={width}
        className={classes("vc-aicord-icon", className)}
        fill="currentColor"
    >
        <path d="M7 1l1.5 3.2L11.7 5.7 8.5 7.2 7 10.4 5.5 7.2 2.3 5.7 5.5 4.2 7 1z" />
        <path d="M13.5 8l.9 1.9 2 .8-2 .9-.9 1.9-.8-1.9-2-.9 2-.8.8-1.9z" />
        <path d="M19 13v3h3v2h-3v3h-2v-3h-3v-2h3v-3h2z" />
    </svg>
);
