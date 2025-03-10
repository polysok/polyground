import {ChatCompletionTool, ChatCompletionToolChoiceOption} from "openai/resources/chat/index";
import React, {useEffect, useState} from "react";
import {useTheme} from "next-themes";
import {PlusCircle, X} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import {json} from "@codemirror/lang-json";
import ResizeableTextarea  from "@/components/resizeable-textarea";
const ToolSettings = ({
                          tools,
                          setTools,
                          toolChoice,
                          setToolChoice,
                      }: {
    tools: ChatCompletionTool[];
    setTools: (tools: ChatCompletionTool[]) => void;
    toolChoice: ChatCompletionToolChoiceOption;
    setToolChoice: (toolChoice: ChatCompletionToolChoiceOption) => void;
}) => {
    const [currentToolChoice, setCurrentToolChoice] =
        useState<ChatCompletionToolChoiceOption>(toolChoice);
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
        setToolChoice(currentToolChoice);
    };
    useEffect(() => {
        setCurrentTools(
            tools.map((tool) => ({
                name: tool.function.name,
                description: tool.function.description ?? "",
                parameters: JSON.stringify(tool.function.parameters, null, 2) ?? "",
            }))
        );
    }, [tools]);
    useEffect(() => {
        setCurrentToolChoice(toolChoice);
    }, [toolChoice]);
    const reset = () => {
        setCurrentTools(
            tools.map((tool) => ({
                name: tool.function.name,
                description: tool.function.description ?? "",
                parameters: JSON.stringify(tool.function.parameters, null, 2) ?? "",
            }))
        );
        setCurrentToolChoice(toolChoice);
    };

    return (
        <>
            <div className="w-full h-full p-4 gap-2 flex flex-col">
                <div>
                    <div className="flex justify-between">
                        <h1 className="font-bold text-lg">Tools</h1>
                    </div>
                    <p className="text-slate-500">Configure tools.</p>
                </div>
                <div className="flex flex-col gap-4 py-4 overflow-y-auto px-2 -mx-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-800 dark:text-slate-400 text-sm font-bold">
                            Tool Choice
                        </label>
                        <select
                            value={
                                typeof currentToolChoice === "string"
                                    ? currentToolChoice
                                    : `tool:${currentToolChoice.function.name}`
                            }
                            onChange={(e) => {
                                if (e.target.value.startsWith("tool:")) {
                                    setCurrentToolChoice({
                                        type: "function",
                                        function: {
                                            name: e.target.value.split(":")[1],
                                        },
                                    });
                                } else {
                                    if (e.target.value === "auto") {
                                        setCurrentToolChoice("auto");
                                    } else {
                                        setCurrentToolChoice("none");
                                    }
                                }
                            }}
                            className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
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
                                                    className="rounded-lg p-0 bg-white dark:bg-slate-900 text-base"
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
                <div className="flex gap-2">
                    <button
                        className="p-2 px-4 w-full sm:w-auto rounded-lg disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-800 dark:disabled:text-slate-400 bg-emerald-600 text-white font-bold hover:bg-emerald-700 dark:hover:bg-emerald-500 focus:outline-none"
                        onClick={() => {
                            saveToolSettings();
                        }}
                        disabled={
                            currentTools.length === tools.length &&
                            currentTools.every(
                                (tool, index) =>
                                    tool.name === tools[index].function.name &&
                                    tool.description === tools[index].function.description &&
                                    tool.parameters ===
                                    JSON.stringify(tools[index].function.parameters, null, 2)
                            ) &&
                            currentToolChoice === toolChoice
                        }
                    >
                        Save
                    </button>
                    <button
                        onClick={reset}
                        className="p-2 px-4 w-full sm:w-auto rounded-lg disabled:bg-slate-100 dark:disabled:bg-slate-500 disabled:text-slate-400 dark:disabled:text-slate-800 bg-slate-200 text-slate-800 font-bold hover:bg-slate-300 focus:outline-none"
                        disabled={
                            currentTools.length === tools.length &&
                            currentTools.every(
                                (tool, index) =>
                                    tool.name === tools[index].function.name &&
                                    tool.description === tools[index].function.description &&
                                    tool.parameters ===
                                    JSON.stringify(tools[index].function.parameters, null, 2)
                            ) &&
                            currentToolChoice === toolChoice
                        }
                    >
                        Reset
                    </button>
                </div>
            </div>
        </>
    );
};
export default ToolSettings;