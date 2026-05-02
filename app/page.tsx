"use client";

import {useEffect, useId, useRef, useState} from "react";
import {useSearchParams} from "next/navigation";

import {
    Settings,
    Settings2,
    X,
    Wrench,
    Plus,
    ArrowDown,
    Sun,
    Moon,
} from "lucide-react";

import {Dialog, Tab} from "@headlessui/react";
import {
    oneLight as light,
    oneDark as dark,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import "katex/dist/katex.min.css";
import OpenAI from "openai";
import {
    ChatCompletionMessage,
    ChatCompletionMessageParam,
    ChatCompletionTool,
    ChatCompletionToolChoiceOption,
    ChatCompletionChunk,
    ChatCompletion,
} from "openai/resources/chat/index";

import React from "react";
import {Stream} from "openai/streaming.mjs";
import {useTheme} from "next-themes";
import ChatMessage from "@/components/chat-message";
import CopyButton from "@/components/copy-button";
import ToolSettings from "@/components/tool-settings";
import SettingsDialog from "@/components/settings-dialog";
import ToolSettingsDialog from "@/components/tool-settings-dialog";
import {listModels as fetchListModels, createChatCompletion, ChatSettings} from "@/lib/openai-service";

const SCROLL_THRESHOLD = 5;

type FullSettings = {
    model: string;
    models: string[];
    seed: number;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    maxTokens: number;
    stop: string[];
    jsonMode: boolean;
    stream: boolean;
};

const INITIAL_SETTINGS: FullSettings = {
    model: "",
    models: [],
    seed: -1,
    temperature: 0.5,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxTokens: -1,
    stop: [],
    jsonMode: false,
    stream: true,
};

const INITIAL_TOOLS: ChatCompletionTool[] = [];

const INITIAL_TOOL_CHOICE: ChatCompletionToolChoiceOption = "auto";

const INITIAL_MESSAGES: ChatCompletionMessageParam[] = [
    {role: "system", content: "You are a helpful assistant"},
    {role: "user", content: ""},
];

interface ErrorBoundaryProps {
    fallback: React.ReactNode;
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(_: Error): ErrorBoundaryState {
        return {hasError: true};
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}

const isDisabled = (
    model: string,
    seed: number,
    temperature: number,
    maxTokens: number,
    topP: number,
    presencePenalty: number,
    frequencyPenalty: number,
    jsonMode: boolean,
    stop: string[],
    stream: boolean,
    settings: FullSettings
): boolean =>
    model === settings.model &&
    seed === settings.seed &&
    temperature === settings.temperature &&
    maxTokens === settings.maxTokens &&
    topP === settings.topP &&
    presencePenalty === settings.presencePenalty &&
    frequencyPenalty === settings.frequencyPenalty &&
    jsonMode === settings.jsonMode &&
    stop.length === settings.stop.length &&
    stop.every(
        (stopSequence, index) => stopSequence === settings.stop[index]
    ) &&
    stream === settings.stream;

const SamplingSettingsContent = ({
    settings,
    setSettings,
    showModelInput,
    onClose,
}: {
    settings: FullSettings;
    setSettings: (settings: FullSettings) => void;
    showModelInput?: boolean;
    onClose?: () => void;
}) => {
    const [model, setModel] = useState(settings.model);
    const [models, setModels] = useState<string[]>(settings.models);
    const modelId = useId();
    const modelRef = useRef<HTMLInputElement | null>(null);
    const [seed, setSeed] = useState(settings.seed);
    const seedId = useId();
    const [temperature, setTemperature] = useState(settings.temperature);
    const temperatureId = useId();
    const [maxTokens, setMaxTokens] = useState(settings.maxTokens);
    const maxTokensId = useId();
    const [topP, setTopP] = useState(settings.topP);
    const topPId = useId();
    const [presencePenalty, setPresencePenalty] = useState(
        settings.presencePenalty
    );
    const presencePenaltyId = useId();
    const [frequencyPenalty, setFrequencyPenalty] = useState(
        settings.frequencyPenalty
    );
    const frequencyPenaltyId = useId();
    const [jsonMode, setJsonMode] = useState(settings.jsonMode);
    const jsonModeId = useId();
    const [stopSequence, setStopSequence] = useState<string>("");
    const stopId = useId();
    const [stop, setStop] = useState<string[]>(settings.stop);
    const [stream, setStream] = useState(settings.stream);
    const streamId = useId();

    const safeSetSeed = (val: string) => {
        const parsed = parseInt(val);
        if (!isNaN(parsed)) setSeed(parsed);
    };

    const safeSetFloat = (setter: (v: number) => void, val: string) => {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) setter(parsed);
    };

    const save = () => {
        const newSettings: FullSettings = {
            model,
            models,
            seed,
            temperature,
            maxTokens,
            topP,
            presencePenalty,
            frequencyPenalty,
            jsonMode,
            stop,
            stream,
        };
        setSettings(newSettings);
        if (onClose) onClose();
    };

    const reset = () => {
        setModel(settings.model);
        setModels([]);
        setSeed(settings.seed);
        setTemperature(settings.temperature);
        setMaxTokens(settings.maxTokens);
        setTopP(settings.topP);
        setPresencePenalty(settings.presencePenalty);
        setFrequencyPenalty(settings.frequencyPenalty);
        setJsonMode(settings.jsonMode);
        setStop(settings.stop);
        setStream(settings.stream);
    };

    useEffect(() => {
        fetchListModels().then((fetchedModels) => {
            setModels(fetchedModels);
        });
    }, []);

    return (
        <>
            <div className="flex flex-col gap-4 py-4 overflow-y-auto px-2 -mx-2">
                {showModelInput ? (
                    <div className="w-full">
                        <label
                            htmlFor={modelId}
                            className="text-slate-800 dark:text-slate-400 text-sm font-bold"
                        >
                            Model
                        </label>
                        <input
                            id={modelId}
                            value={model}
                            ref={modelRef}
                            onChange={(e) => setModel(e.target.value)}
                            type="text"
                            className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                            placeholder="Model name"
                        />
                    </div>
                ) : (
                    <div className="w-full">
                        <label
                            htmlFor={modelId}
                            className="text-slate-800 dark:text-slate-400 text-sm font-bold"
                        >
                            Model
                        </label>
                        <select
                            id={modelId}
                            value={model}
                            className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                            onChange={(e) => setModel(e.target.value)}
                        >
                            <option value="">---</option>
                            {models.map((modelName) => (
                                <option key={modelName} value={modelName}>{modelName}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="w-full flex flex-col gap-2">
                    <label htmlFor={seedId} className="text-slate-800 dark:text-slate-400 text-sm font-bold">Seed</label>
                    <input
                        id={seedId}
                        value={seed}
                        onChange={(e) => safeSetSeed(e.target.value)}
                        type="number"
                        className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                        placeholder="Seed value. Enter -1 for random."
                    />
                </div>
                <div className="w-full flex flex-col gap-2">
                    <label htmlFor={temperatureId} className="text-slate-800 dark:text-slate-400 text-sm font-bold">Temperature</label>
                    <input
                        id={temperatureId}
                        value={temperature}
                        onChange={(e) => safeSetFloat(setTemperature, e.target.value)}
                        type="number"
                        className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                        placeholder="Sampling temperature. Enter 0 for deterministic decoding."
                    />
                </div>
                <div className="w-full flex flex-col gap-2">
                    <label htmlFor={topPId} className="text-slate-800 dark:text-slate-400 text-sm font-bold">Top P</label>
                    <input
                        id={topPId}
                        value={topP}
                        onChange={(e) => safeSetFloat(setTopP, e.target.value)}
                        type="number"
                        className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                        placeholder="Enter the top p for the OpenAI API"
                    />
                </div>
                <div className="w-full flex flex-col gap-2">
                    <label htmlFor={frequencyPenaltyId} className="text-slate-800 dark:text-slate-400 text-sm font-bold">Frequency Penalty</label>
                    <input
                        id={frequencyPenaltyId}
                        value={frequencyPenalty}
                        onChange={(e) => safeSetFloat(setFrequencyPenalty, e.target.value)}
                        type="number"
                        className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                        placeholder="Enter the frequency penalty for the OpenAI API"
                    />
                </div>
                <div className="w-full flex flex-col gap-2">
                    <label htmlFor={presencePenaltyId} className="text-slate-800 dark:text-slate-400 text-sm font-bold">Presence Penalty</label>
                    <input
                        id={presencePenaltyId}
                        value={presencePenalty}
                        onChange={(e) => safeSetFloat(setPresencePenalty, e.target.value)}
                        type="number"
                        className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                        placeholder="Enter the presence penalty for the OpenAI API"
                    />
                </div>
                <div className="w-full flex flex-col gap-2">
                    <label htmlFor={maxTokensId} className="text-slate-800 dark:text-slate-400 text-sm font-bold">Max Tokens</label>
                    <input
                        id={maxTokensId}
                        value={maxTokens}
                        onChange={(e) => safeSetSeed(e.target.value)}
                        type="number"
                        className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                        placeholder="Maximum number of tokens to generate. Enter -1 for no limit."
                    />
                </div>
                <div className="w-full flex flex-col gap-2">
                    <label className="text-slate-800 dark:text-slate-400 text-sm font-bold">Stop Sequences</label>
                    <div className="flex">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (stopSequence === "") return;
                                if (stop.includes(stopSequence)) return;
                                setStop([...stop, stopSequence]);
                                setStopSequence("");
                            }}
                            className="flex w-full gap-2"
                        >
                            <input
                                value={stopSequence}
                                onChange={(e) => setStopSequence(e.target.value)}
                                type="text"
                                className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                                placeholder="word used to stop generation."
                            />
                            <button
                                type="submit"
                                disabled={stopSequence === ""}
                                className="p-1 sm:p-2 focus:outline-none focus:ring-none rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 disabled:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-400"
                            >
                                <Plus className="w-5 h-5"/>
                            </button>
                        </form>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {stop.map((seq, idx) => (
                            <div
                                key={idx}
                                className="text-slate-800 bg-slate-200 rounded-lg text-sm dark:text-slate-400 dark:bg-slate-700"
                            >
                                <button
                                    onClick={() => setStop(stop.filter((_, i) => i !== idx))}
                                    className="p-1 sm:p-2 focus:ring-none rounded-lg border border-none focus:border-none flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-400"
                                >
                                    {seq}
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full flex flex-col gap-2">
                    <label htmlFor={jsonModeId} className="text-slate-800 dark:text-slate-400 text-sm font-bold">JSON Mode</label>
                    <div className="flex items-center gap-2">
                        <input
                            id={jsonModeId}
                            checked={jsonMode}
                            onChange={(e) => setJsonMode(e.target.checked)}
                            type="checkbox"
                            className="p-1 sm:p-2 focus:ring-emerald-600 text-emerald-600 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:checked:bg-emerald-600"
                        />
                        <label htmlFor={jsonModeId} className="text-sm">Enabled</label>
                    </div>
                </div>
                <div className="w-full flex flex-col gap-2">
                    <label htmlFor={streamId} className="text-slate-800 dark:text-slate-400 text-sm font-bold">Stream</label>
                    <div className="flex items-center gap-2">
                        <input
                            id={streamId}
                            checked={stream}
                            onChange={(e) => setStream(e.target.checked)}
                            type="checkbox"
                            className="p-1 sm:p-2 focus:ring-emerald-600 text-emerald-600 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:checked:bg-emerald-600"
                        />
                        <label htmlFor={streamId} className="text-sm">Enabled</label>
                    </div>
                </div>
            </div>
            {onClose ? (
                <div>
                    <button
                        className="px-4 py-2 w-full sm:w-auto rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white focus:outline-none"
                        onClick={save}
                    >
                        Save
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <button
                        className="p-2 px-4 w-full sm:w-auto rounded-lg disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-800 dark:disabled:text-slate-400 bg-emerald-600 dark:bg-emerald-500 text-white font-bold hover:bg-emerald-700 dark:hover:bg-emerald-400 focus:outline-none"
                        onClick={save}
                        disabled={isDisabled(model, seed, temperature, maxTokens, topP, presencePenalty, frequencyPenalty, jsonMode, stop, stream, settings)}
                    >
                        Save
                    </button>
                    <button
                        className="p-2 px-4 w-full sm:w-auto rounded-lg disabled:bg-slate-100 dark:disabled:bg-slate-500 disabled:text-slate-400 dark:disabled:text-slate-800 bg-slate-200 text-slate-800 font-bold hover:bg-slate-300 focus:outline-none"
                        onClick={reset}
                        disabled={isDisabled(model, seed, temperature, maxTokens, topP, presencePenalty, frequencyPenalty, jsonMode, stop, stream, settings)}
                    >
                        Reset
                    </button>
                </div>
            )}
        </>
    );
};

const SamplingSettings = ({
    settings,
    setSettings,
}: {
    settings: FullSettings;
    setSettings: (settings: FullSettings) => void;
}) => {
    return (
        <div className="w-full h-full p-4 gap-2 flex flex-col">
            <div>
                <div className="flex justify-between">
                    <div className="font-bold text-lg">Parameters</div>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                    Configure parameters for chat completion requests.
                </p>
            </div>
            <SamplingSettingsContent settings={settings} setSettings={setSettings} showModelInput={false} />
        </div>
    );
};

const SamplingSettingsDialog = ({
    settings,
    setSettings,
    settingsOpen,
    setSettingsOpen,
}: {
    settings: FullSettings;
    setSettings: (settings: FullSettings) => void;
    settingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;
}) => {
    return (
        <Dialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            className="relative z-50"
        >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true"/>
            <div className="fixed inset-0 flex w-screen items-start sm:items-center justify-center p-0 sm:p-4 max-h-dvh">
                <Dialog.Panel className="shadow-xl rounded-b-lg sm:rounded-lg border max-w-none sm:max-w-xl w-full bg-white dark:bg-slate-900 p-4 gap-2 flex flex-col max-h-dvh">
                    <div>
                        <div className="flex justify-between">
                            <Dialog.Title className="font-bold text-lg">Parameters</Dialog.Title>
                            <button
                                className="focus:outline-none text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-400"
                                onClick={() => setSettingsOpen(false)}
                            >
                                <X className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-400"/>
                            </button>
                        </div>
                        <Dialog.Description className="text-slate-500 dark:text-slate-400">
                            Configure parameters for chat completion requests.
                        </Dialog.Description>
                    </div>
                    <SamplingSettingsContent
                        settings={settings}
                        setSettings={setSettings}
                        showModelInput={true}
                        onClose={() => setSettingsOpen(false)}
                    />
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

const getCopyUrl = ({
    messages,
    tools,
    toolChoice,
    settings,
}: {
    messages: ChatCompletionMessageParam[];
    tools: ChatCompletionTool[];
    toolChoice: ChatCompletionToolChoiceOption;
    settings: FullSettings;
}) => {
    const baseUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    let url = `${baseUrl}/?`;
    if (JSON.stringify(messages) !== JSON.stringify(INITIAL_MESSAGES)) {
        url += `messages=${encodeURIComponent(JSON.stringify(messages))}&`;
    }
    if (JSON.stringify(tools) !== JSON.stringify(INITIAL_TOOLS)) {
        url += `tools=${encodeURIComponent(JSON.stringify(tools))}&`;
    }
    if (JSON.stringify(toolChoice) !== JSON.stringify(INITIAL_TOOL_CHOICE)) {
        url += `tool_choice=${encodeURIComponent(JSON.stringify(toolChoice))}&`;
    }
    if (JSON.stringify(settings) !== JSON.stringify(INITIAL_SETTINGS)) {
        url += `settings=${encodeURIComponent(JSON.stringify(settings))}`;
    }
    return url;
};

const ShowScrollToBottom = ({
    elementRef,
    children,
    deps,
}: {
    elementRef: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
    deps?: React.DependencyList;
}) => {
    const [showScrollButton, setShowScrollButton] = useState(false);
    useEffect(() => {
        const checkScroll = () => {
            if (!elementRef.current) return;
            const distanceToBottom =
                elementRef.current.scrollHeight -
                elementRef.current.scrollTop -
                elementRef.current.clientHeight;
            const isAtBottom = distanceToBottom <= SCROLL_THRESHOLD;
            const hasScrollBar = elementRef.current.scrollHeight > elementRef.current.clientHeight;
            setShowScrollButton(hasScrollBar && !isAtBottom);
        };
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => {
            window.removeEventListener("resize", checkScroll);
        };
    }, [elementRef, deps]);

    useEffect(() => {
        const container = elementRef.current;
        if (!container) return;
        const checkScroll = () => {
            if (!elementRef.current) return;
            const distanceToBottom =
                elementRef.current.scrollHeight -
                elementRef.current.scrollTop -
                elementRef.current.clientHeight;
            const isAtBottom = distanceToBottom <= SCROLL_THRESHOLD;
            const hasScrollBar = elementRef.current.scrollHeight > elementRef.current.clientHeight;
            setShowScrollButton(hasScrollBar && !isAtBottom);
        };
        container.addEventListener("scroll", checkScroll);
        return () => {
            container.removeEventListener("scroll", checkScroll);
        };
    }, [elementRef]);

    return showScrollButton ? <>{children}</> : null;
};

const ErrorToast = ({
    error,
    dismiss,
}: {
    error: Error;
    dismiss: () => void;
}) => {
    return (
        <div className="absolute top-0 left-0 right-0 flex justify-center items-center p-2 pointer-events-none">
            <div className="max-w-full flex gap-2 p-4 bg-red-500 text-white font-bold rounded-lg items-baseline shadow-lg pointer-events-auto">
                <div>Error:</div>
                <div className="flex-1 overflow-auto">{error.message}</div>
                <button onClick={dismiss}>
                    <X className="w-5 h-5 -mb-1"/>
                </button>
            </div>
        </div>
    );
};

const parseJsonParam = <T,>(params: URLSearchParams, key: string, fallback: T): T => {
    const param = params.get(key);
    if (!param) return fallback;
    try {
        return JSON.parse(param) as T;
    } catch (error) {
        console.error(`Error parsing ${key} query parameter:`, error);
        return fallback;
    }
};

export default function Home() {
    const queryParams = useSearchParams();
    const [messages, setMessages] = useState<ChatCompletionMessageParam[]>(
        parseJsonParam(queryParams, "messages", INITIAL_MESSAGES)
    );
    const [tools, setTools] = useState<ChatCompletionTool[]>(
        parseJsonParam(queryParams, "tools", INITIAL_TOOLS)
    );
    const [toolChoice, setToolChoice] = useState<ChatCompletionToolChoiceOption>(
        parseJsonParam(queryParams, "tool_choice", INITIAL_TOOL_CHOICE)
    );
    const [settings, setSettings] = useState<FullSettings>(
        parseJsonParam(queryParams, "settings", INITIAL_SETTINGS)
    );
    const abortControllerRef = useRef<AbortController | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [samplingSettingsOpen, setSamplingSettingsOpen] = useState(false);
    const [toolSettingsOpen, setToolSettingsOpen] = useState(false);
    const [completionMetrics, setCompletionMetrics] = useState<{
        startTime: number;
        endTime: number | null;
        firstTokenTime: number | null;
        latestTokenTime: number | null;
        nTokens: number | null;
    } | null>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const messagesContainerBottomRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<Error | null>(null);
    const {theme, setTheme} = useTheme();

    const deleteAfterMessage = (index: number) => {
        setMessages((msgs) => {
            const newMessages = [...msgs];
            newMessages.splice(index + 1);
            return [...newMessages];
        });
    };
    const deleteMessage = (index: number) => {
        setMessages((msgs) => {
            const newMessages = [...msgs];
            newMessages.splice(index, 1);
            return [...newMessages];
        });
    };
    const addNewMessage = () => {
        setMessages((msgs) => {
            const newMessages = [...msgs];
            newMessages.push({role: "user", content: ""});
            return newMessages;
        });
    };

    const setMessageAt = (index: number, newMessage: ChatCompletionMessageParam) => {
        setMessages((msgs) => {
            const newMessages = [...msgs];
            newMessages[index] = newMessage;
            return newMessages;
        });
    };

    const sendMessage = () => {
        if (abortControllerRef.current) return;

        setMessages((msgs) => [...msgs, {role: "assistant", content: ""}]);

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const signal = controller.signal;
        const now = Date.now();
        setCompletionMetrics({
            startTime: now,
            firstTokenTime: null,
            latestTokenTime: now,
            nTokens: null,
            endTime: null,
        });

        setMessages((msgs) => {
            createChatCompletion(msgs, settings as ChatSettings, tools, toolChoice, {signal})
                .then(async (responseStream) => {
                    if (!settings.stream) {
                        const response = responseStream as ChatCompletion;
                        if (response.choices.length === 0) {
                            setCompletionMetrics(null);
                            return;
                        }
                        const content = response.choices[0].message.content;
                        if (content) {
                            setMessages((m) => [
                                ...m.slice(0, -1),
                                {role: "assistant", content},
                            ]);
                        }
                        const toolCalls = response.choices[0].message.tool_calls;
                        if (toolCalls && toolCalls.length > 0) {
                            setMessages((m) => {
                                if (m.length === 0) return m;
                                const lastMessage = m[m.length - 1] as ChatCompletionMessage;
                                let lastMessageToolCalls = lastMessage.tool_calls ?? [];
                                if (
                                    toolCalls[0].id !== undefined &&
                                    lastMessageToolCalls.filter((tc) => tc.id === toolCalls[0].id).length === 0
                                ) {
                                    const newToolCall = {
                                        id: toolCalls[0].id,
                                        type: toolCalls[0].type,
                                        function: {
                                            name: toolCalls[0].function?.name,
                                            arguments: toolCalls[0].function?.arguments || "",
                                        },
                                    };
                                    const newLastMessage = {
                                        ...lastMessage,
                                        tool_calls: [...lastMessageToolCalls, newToolCall],
                                    };
                                    return [...m.slice(0, -1), newLastMessage];
                                }
                                return m;
                            });
                        }
                        setCompletionMetrics(null);
                        return;
                    }

                    setCompletionMetrics((metrics) => {
                        if (metrics) {
                            const n = Date.now();
                            return {
                                ...metrics,
                                firstTokenTime: n,
                                latestTokenTime: n,
                                nTokens: 1,
                            };
                        }
                        return null;
                    });

                    for await (const message of responseStream as Stream<ChatCompletionChunk>) {
                        setCompletionMetrics((metrics) => {
                            if (metrics) {
                                const n = Date.now();
                                return {
                                    ...metrics,
                                    latestTokenTime: n,
                                    nTokens: metrics.nTokens ? metrics.nTokens + 1 : 1,
                                };
                            }
                            return null;
                        });
                        const content = message.choices[0].delta.content;
                        if (content) {
                            setMessages((m) => {
                                if (m.length === 0) return m;
                                const lastMessage = m[m.length - 1] as ChatCompletionMessage;
                                const lastMessageContent = lastMessage.content;
                                return [
                                    ...m.slice(0, -1),
                                    {
                                        role: "assistant",
                                        content: lastMessageContent
                                            ? lastMessageContent + content
                                            : content,
                                    },
                                ];
                            });
                        }
                        const toolCalls = message.choices[0].delta.tool_calls;
                        if (toolCalls && toolCalls.length > 0) {
                            setMessages((m) => {
                                if (m.length === 0) return m;
                                let lastMessage = m[m.length - 1] as ChatCompletionMessage;
                                let lastMessageToolCalls = lastMessage.tool_calls ?? [];

                                if (toolCalls[0].id !== undefined &&
                                    lastMessageToolCalls.filter((tc) => tc.id === toolCalls[0].id).length === 0
                                ) {
                                    if (toolCalls[0].id === undefined) {
                                        throw new Error("toolCalls[0].id is undefined");
                                    }
                                    if (toolCalls[0].function?.name === undefined) {
                                        throw new Error("toolCalls[0].function.name is undefined");
                                    }
                                    if (toolCalls[0].type === undefined) {
                                        throw new Error("toolCalls[0].type is undefined");
                                    }
                                    const newToolCall = {
                                        id: toolCalls[0].id,
                                        type: toolCalls[0].type,
                                        function: {
                                            name: toolCalls[0].function?.name,
                                            arguments: toolCalls[0].function?.arguments || "",
                                        },
                                    };
                                    const newLastMessage = {
                                        ...lastMessage,
                                        tool_calls: [...lastMessageToolCalls, newToolCall],
                                    };
                                    return [...m.slice(0, -1), newLastMessage];
                                } else {
                                    if (lastMessageToolCalls.length === 0) return m;
                                    let lastToolCall = lastMessageToolCalls[lastMessageToolCalls.length - 1];
                                    let lastToolCallFunctionArguments = lastToolCall.function?.arguments || "";
                                    lastToolCallFunctionArguments += toolCalls[0]?.function?.arguments || "";
                                    return [
                                        ...m.slice(0, -1),
                                        {
                                            ...lastMessage,
                                            tool_calls: [
                                                ...lastMessageToolCalls.slice(0, -1),
                                                {
                                                    ...lastToolCall,
                                                    function: {
                                                        ...lastToolCall.function,
                                                        arguments: lastToolCallFunctionArguments,
                                                    },
                                                },
                                            ],
                                        },
                                    ];
                                }
                            });
                        }
                    }
                    setCompletionMetrics((metrics) => {
                        if (metrics) {
                            const n = Date.now();
                            return {
                                ...metrics,
                                endTime: n,
                            };
                        }
                        return null;
                    });
                    addNewMessage();
                })
                .catch((err) => {
                    if (err.name === "AbortError") return;
                    console.error(err);
                    setError(err);
                })
                .finally(() => {
                    abortControllerRef.current = null;
                });
            return msgs;
        });
    };

    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/polyground/sw.js")
                .then((registration) =>
                    console.log("Service Worker registration successful with scope: ", registration.scope)
                )
                .catch((err) =>
                    console.log("Service Worker registration failed: ", err)
                );
        }
    }, []);

    useEffect(() => {
        if (theme === "dark") {
            document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0f172a");
        } else {
            document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#fafaf9");
        }
    }, [theme]);

    return (
        <div
            className="flex h-dvh flex-col items-center justify-between p-0 sm:p-2 lg:p-4 bg-stone-200 dark:bg-slate-800 relative overflow-hidden text-slate-800 dark:text-slate-200"
            onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                    sendMessage();
                }
            }}
            autoFocus
            tabIndex={0}
        >
            <div className="p-1 sm:p-4 flex flex-col border rounded-none sm:rounded-lg shadow-lg grow max-w-screen-2xl w-full bg-stone-50 dark:bg-slate-900 overflow-hidden">
                <div className="w-full py-3 pl-3 pr-2 sm:pl-6 sm:pr-3 pb-4 border-b border-slate-200 dark:border-slate-700 sm:border-none flex justify-between items-center sm:items-baseline overflow-hidden">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold">Polyground</h1>
                        <p className="text-slate-500 dark:text-slate-400 hidden sm:block">
                            A playground for local and/or openai like llms.
                            <br/>
                            <span className="inline-flex gap-2"/>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {theme === "dark" ? (
                            <button onClick={() => setTheme("light")} className="focus:outline-none" title="Light mode">
                                <Sun className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-400"/>
                            </button>
                        ) : (
                            <button onClick={() => setTheme("dark")} className="focus:outline-none" title="Dark mode">
                                <Moon className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-400"/>
                            </button>
                        )}
                        <button
                            onClick={() => setSamplingSettingsOpen(!samplingSettingsOpen)}
                            className="focus:outline-none block lg:hidden"
                            title="Parameters"
                        >
                            <Settings2 className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-400"/>
                        </button>
                        <button
                            onClick={() => setToolSettingsOpen(!toolSettingsOpen)}
                            className="focus:outline-none block lg:hidden"
                            title="Tools"
                        >
                            <Wrench className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-400"/>
                        </button>
                        <button
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            className="focus:outline-none"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-400"/>
                        </button>
                    </div>
                </div>
                <div className="flex h-full overflow-hidden">
                    <div className="flex flex-col justify-between flex-1 h-full overflow-hidden">
                        <div className="flex flex-col items-start gap-2 pb-4 relative overflow-hidden">
                            <div
                                className="flex flex-col items-start gap-2 pb-4 w-full overflow-y-auto"
                                ref={messageContainerRef}
                            >
                                <ul className="pr-[12px] flex flex-col w-full divide-slate-200 dark:divide-slate-700">
                                    {messages.map((message, index) => {
                                        return (
                                            (index < messages.length - 1 || message.role === "assistant") && (
                                            <li key={message.role + "-" + index} className="flex-1">
                                                <ChatMessage
                                                    isUserPromptMessage={false}
                                                    index={index}
                                                    message={message}
                                                    deleteAfterMessage={deleteAfterMessage}
                                                    sendMessage={sendMessage}
                                                    setMessage={(newMessage) => setMessageAt(index, newMessage)}
                                                    deleteMessage={() => deleteMessage(index)}
                                                />
                                            </li>)
                                        );
                                    })}
                                </ul>
                                <div ref={messagesContainerBottomRef}></div>
                            </div>
                            <ShowScrollToBottom elementRef={messageContainerRef} deps={[messages]}>
                                <div className="bottom-0 left-0 right-0 w-full absolute flex items-center justify-center pb-2">
                                    <button
                                        className="px-2 py-2 w-auto rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-400 font-bold focus:outline-none border border-slate-200 dark:border-slate-700 shadow flex"
                                        onClick={() => {
                                            messagesContainerBottomRef.current?.scrollIntoView({behavior: "smooth"});
                                        }}
                                    >
                                        <ArrowDown/>
                                    </button>
                                </div>
                            </ShowScrollToBottom>
                        </div>

                        <div className="sm:pr-4 pt-2 pb-1 border-t border-slate-200 dark:border-slate-700 sm:border-none flex flex-col-reverse sm:flex-row gap-2">
                            {abortControllerRef.current && (
                                <button
                                    onClick={() => abortControllerRef.current?.abort()}
                                    className="px-4 py-2 w-full sm:w-auto rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold focus:outline-none"
                                >
                                    Stop
                                </button>
                            )}
                            {tools.length > 0 && (
                                <select
                                    value={typeof toolChoice === "string" ? toolChoice : `tool:${toolChoice.function.name}`}
                                    onChange={(e) => {
                                        if (e.target.value.startsWith("tool:")) {
                                            setToolChoice({type: "function", function: {name: e.target.value.split(":")[1]}});
                                        } else {
                                            setToolChoice(e.target.value === "auto" ? "auto" : "none");
                                        }
                                    }}
                                    className="hidden w-auto min-w-[14rem] p-1 sm:p-2 focus:ring-emerald-600 focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-800"
                                >
                                    <option value="auto">Auto</option>
                                    <option value="none">None</option>
                                    {tools.map((tool) => (
                                        <option key={tool.function.name} value={`tool:${tool.function.name}`}>
                                            Tool: {tool.function.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {messages.map((message, index) => {
                                return (
                                    index === messages.length - 1 && message.role === "user" && (
                                        <div key={"input-" + index} className="flex-1">
                                            <ChatMessage
                                                isUserPromptMessage={true}
                                                index={index}
                                                message={message}
                                                deleteAfterMessage={deleteAfterMessage}
                                                sendMessage={sendMessage}
                                                setMessage={(newMessage) => setMessageAt(index, newMessage)}
                                                deleteMessage={() => {}}
                                            />
                                        </div>)
                                );
                            })}
                        </div>
                    </div>

                    <div className="hidden lg:flex flex-col max-w-sm w-full overflow-hidden">
                        <Tab.Group>
                            <span className="px-2 flex">
                                <Tab.List className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg font-bold flex w-full">
                                    <Tab className={({selected}) => "flex-1 focus:outline-none py-1 px-4 " + (selected ? "bg-white dark:bg-slate-900 rounded-lg shadow text-slate-800 dark:text-slate-200" : "bg-transparent text-slate-500 dark:text-slate-400")}>
                                        Parameters
                                    </Tab>
                                    <Tab className={({selected}) => "flex-1 focus:outline-none py-1 px-4 " + (selected ? "bg-white dark:bg-slate-900 rounded-lg shadow text-slate-800 dark:text-slate-200" : "bg-transparent text-slate-500 dark:text-slate-400")}>
                                        Tools
                                    </Tab>
                                </Tab.List>
                            </span>
                            <Tab.Panels className="h-full overflow-hidden">
                                <Tab.Panel className="h-full">
                                    <SamplingSettings settings={settings} setSettings={setSettings}/>
                                </Tab.Panel>
                                <Tab.Panel className="h-full">
                                    <ToolSettings
                                        tools={tools}
                                        setTools={setTools}
                                        toolChoice={toolChoice}
                                        setToolChoice={setToolChoice}
                                    />
                                </Tab.Panel>
                            </Tab.Panels>
                        </Tab.Group>
                    </div>
                </div>
            </div>
            {settingsOpen && (
                <SettingsDialog settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen}/>
            )}
            {samplingSettingsOpen && (
                <SamplingSettingsDialog
                    settingsOpen={samplingSettingsOpen}
                    setSettingsOpen={setSamplingSettingsOpen}
                    settings={settings}
                    setSettings={setSettings}
                />
            )}
            {toolSettingsOpen && (
                <ToolSettingsDialog
                    tools={tools}
                    setTools={setTools}
                    toolChoice={toolChoice}
                    setToolChoice={setToolChoice}
                    settingsOpen={toolSettingsOpen}
                    setSettingsOpen={setToolSettingsOpen}
                />
            )}
            {error && <ErrorToast error={error} dismiss={() => setError(null)}/>}
        </div>
    );
}
