import {ChatCompletionTool, ChatCompletionToolChoiceOption} from "openai/resources/chat/index";
import React, {useRef, useState} from "react";
import {useTheme} from "next-themes";
import {Dialog} from "@headlessui/react";
import {PlusCircle, X} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import {json} from "@codemirror/lang-json";
import ResizeableTextarea from "@/components/resizeable-textarea";
const ToolSettingsDialog = ({
                                tools,
                                setTools,
                                toolChoice,
                                setToolChoice,
                                settingsOpen,
                                setSettingsOpen,
                            }: {
    tools: ChatCompletionTool[];
    setTools: (tools: ChatCompletionTool[]) => void;
    toolChoice: ChatCompletionToolChoiceOption;
    setToolChoice: (toolChoice: ChatCompletionToolChoiceOption) => void;
    settingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;
}) => {
    const toolChoiceRef = useRef<HTMLSelectElement | null>(null);
    const [currentTools, setCurrentTools] = useState<
        { name: string; description: string; parameters: string }[]
    >(
        tools.map((tool) => ({
            name: tool.function.name,
            description: tool.function.description ?? "",
            parameters: JSON.stringify(tool.function.parameters, null, 2) ?? "",
        }))
    );
    const {theme} = useTheme();
    const saveToolSettings = () => {
        const tools_parsed = currentTools.map((tool) => ({
            type: "function" as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: JSON.parse(tool.parameters),
            },
        }));
        setTools(tools_parsed);
        setSettingsOpen(false);
    };
    return (
        <Dialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            className="relative z-50"
            initialFocus={toolChoiceRef}
        >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true"/>
            <div
                className="fixed inset-0 flex w-screen items-start sm:items-center justify-center p-0 sm:p-4 max-h-dvh">
                <Dialog.Panel
                    className="shadow-xl rounded-b-lg sm:rounded-lg border max-w-none sm:max-w-xl w-full bg-white dark:bg-slate-900 p-4 gap-2 flex flex-col max-h-dvh">
                    <div>
                        <div className="flex justify-between">
                            <Dialog.Title className="font-bold text-lg">Tools</Dialog.Title>
                            <button
                                className="focus:outline-none text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-400"
                                onClick={() => setSettingsOpen(false)}
                            >
                                <X className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-400"/>
                            </button>
                        </div>
                        <Dialog.Description className="text-slate-500 dark:text-slate-400">
                            Configure tools.
                        </Dialog.Description>
                    </div>
                    <div className="flex flex-col gap-4 py-4 overflow-y-auto px-2 -mx-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-800 dark:text-slate-400 text-sm font-bold">
                                Tool Choice
                            </label>
                            <select
                                value={
                                    typeof toolChoice === "string"
                                        ? toolChoice
                                        : `tool:${toolChoice.function.name}`
                                }
                                onChange={(e) => {
                                    if (e.target.value.startsWith("tool:")) {
                                        setToolChoice({
                                            type: "function",
                                            function: {
                                                name: e.target.value.split(":")[1],
                                            },
                                        });
                                    } else {
                                        if (e.target.value === "auto") {
                                            setToolChoice("auto");
                                        } else {
                                            setToolChoice("none");
                                        }
                                    }
                                }}
                                className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                                ref={toolChoiceRef}
                            >
                                <option value="auto">Auto</option>
                                <option value="none">None</option>
                                {currentTools.map((tool) => (
                                    <option key={tool.name} value={`tool:${tool.name}`}>
                                        Tool: {tool.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-800 dark:text-slate-400 text-sm font-bold">
                                Tools
                            </label>
                            <ul className="flex flex-col gap-2">
                                {currentTools.map((tool, index) => (
                                    <li
                                        key={index}
                                        className="flex flex-col ring ring-slate-200 rounded-lg group-hover:ring-slate-300 dark:group-hover:ring-slate-600 dark:ring-slate-700 bg-white dark:bg-slate-900 focus-within:group-hover:ring-emerald-600 focus-within:ring-emerald-600 focus-within:ring-1 sm:focus-within:ring-2 overflow-hidden dark:focus-within:ring-emerald-600 dark:group-hover:focus-within:ring-emerald-600"
                                    >
                                        <div className="flex flex-col relative">
                                            <div
                                                className="flex flex-col bg-slate-100 border-b border-slate-300 p-2 dark:bg-slate-900 dark:border-slate-700">
                                                <div className="flex justify-between">
                                                    <input
                                                        className="border-none focus:ring-0 focus:border-none bg-transparent p-0 flex-1"
                                                        value={tool.name}
                                                        onChange={(e) => {
                                                            setCurrentTools(
                                                                currentTools.map((t, i) =>
                                                                    i === index
                                                                        ? {
                                                                            ...t,
                                                                            name: e.target.value,
                                                                        }
                                                                        : t
                                                                )
                                                            );
                                                        }}
                                                        placeholder="Tool name"
                                                        autoFocus={tool.name === ""}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setCurrentTools(
                                                                currentTools.filter((_, i) => i !== index)
                                                            );
                                                        }}
                                                        className="p-1 bg-transparent border-none focus:border-none focus:ring-0"
                                                    >
                                                        <X className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                                <ResizeableTextarea
                                                    className="border-none focus:ring-0 focus:border-none resize-none bg-transparent p-0"
                                                    value={tool.description}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLTextAreaElement>
                                                    ) => {
                                                        setCurrentTools(
                                                            currentTools.map((t, i) =>
                                                                i === index
                                                                    ? {
                                                                        ...t,
                                                                        description: e.target.value,
                                                                    }
                                                                    : t
                                                            )
                                                        );
                                                    }}
                                                    placeholder="Tool description"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <code className="whitespace-pre-wrap w-full rounded-lg">
                                                    <CodeMirror
                                                        basicSetup={{
                                                            lineNumbers: false,
                                                            foldGutter: false,
                                                            highlightActiveLine: false,
                                                            highlightSelectionMatches: false,
                                                        }}
                                                        className="rounded-lg p-0 bg-white dark:bg-slate-800 text-base"
                                                        extensions={[json()]}
                                                        value={tool.parameters}
                                                        placeholder="Tool parameters (OpenAPI JSON)"
                                                        theme={theme === "dark" ? "dark" : "light"}
                                                        onChange={(value) => {
                                                            setCurrentTools(
                                                                currentTools.map((t, i) =>
                                                                    i === index ? {...t, parameters: value} : t
                                                                )
                                                            );
                                                        }}
                                                    />
                                                </code>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() =>
                                    setCurrentTools([
                                        ...currentTools,
                                        {
                                            name: "",
                                            description: "",
                                            parameters: "{}",
                                        },
                                    ])
                                }
                                className="px-2 py-1 sm:py-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 w-full font-bold"
                            >
                                <PlusCircle className="w-5 h-5"/>
                                Add Tool
                            </button>
                        </div>
                    </div>
                    <div>
                        <button
                            className="px-4 py-2 w-full sm:w-auto rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white focus:outline-none"
                            onClick={() => {
                                saveToolSettings();
                            }}
                        >
                            Save
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};
export default ToolSettingsDialog;