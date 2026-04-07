/*
 * AiCord - AI-powered message generation for Discord
 * Copyright (c) 2026 128bytes
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const FRAME_COUNT = 5;
const FRAME_WIDTH = 512;

export async function extractVideoFrames(videoUrl: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.preload = "auto";

        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Video frame extraction timed out"));
        }, 30000);

        function cleanup() {
            clearTimeout(timeout);
            video.pause();
            video.removeAttribute("src");
            video.load();
        }

        video.addEventListener("error", () => {
            cleanup();
            reject(new Error("Failed to load video for frame extraction"));
        });

        video.addEventListener("loadedmetadata", async () => {
            const duration = video.duration;
            if (!duration || !isFinite(duration) || duration <= 0) {
                cleanup();
                reject(new Error("Video has no valid duration"));
                return;
            }

            const timestamps: number[] = [];
            for (let i = 0; i < FRAME_COUNT; i++) {
                timestamps.push((duration * (i + 0.5)) / FRAME_COUNT);
            }

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                cleanup();
                reject(new Error("Could not create canvas context"));
                return;
            }

            const frames: string[] = [];

            for (const ts of timestamps) {
                try {
                    const dataUrl = await seekAndCapture(video, canvas, ctx, ts);
                    frames.push(dataUrl);
                } catch {
                    // skip frames that fail
                }
            }

            cleanup();

            if (frames.length === 0) {
                reject(new Error("Could not extract any frames from video"));
            } else {
                resolve(frames);
            }
        });

        video.src = videoUrl;
    });
}

function seekAndCapture(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    time: number
): Promise<string> {
    return new Promise((resolve, reject) => {
        const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);

            const scale = FRAME_WIDTH / video.videoWidth;
            canvas.width = FRAME_WIDTH;
            canvas.height = Math.round(video.videoHeight * scale);

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            resolve(dataUrl);
        };

        video.addEventListener("seeked", onSeeked);
        video.currentTime = time;

        setTimeout(() => {
            video.removeEventListener("seeked", onSeeked);
            reject(new Error("Seek timed out"));
        }, 5000);
    });
}

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i;

export function extractVideoUrls(message: any): string[] {
    const urls: string[] = [];

    if (message.attachments?.length) {
        for (const att of message.attachments) {
            if (att.content_type?.startsWith("video/") || VIDEO_EXTENSIONS.test(att.url ?? "")) {
                urls.push(att.url);
            }
        }
    }

    return urls;
}
