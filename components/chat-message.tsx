import {
    ChatCompletionMessageParam
} from "openai/resources/chat/index";
import React, {useEffect, useRef, useState} from "react";
import {useTheme} from "next-themes";
import ContentArea from "@/components/content-area";
import {Image, Trash2, Paperclip, Type, Wrench, X, Clipboard} from "lucide-react";
import OcrFileEdit from "@/components/ocr";
import CodeMirror from "@uiw/react-codemirror";
import {json} from "@codemirror/lang-json";
import ImageEdit from "@/components/image-edit";
import './animation.css';

const ChatMessage = ({
                         message,
                         setMessage,
                         deleteMessage,
                         sendMessage,
                         deleteAfterMessage,
                         index,
                         isUserPromptMessage
                     }: {
    message: ChatCompletionMessageParam;
    setMessage: (message: ChatCompletionMessageParam) => void;
    deleteMessage: () => void;
    sendMessage: () => void;
    deleteAfterMessage: (index: number) => void;
    index: number;
    isUserPromptMessage: boolean;
}) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const {theme} = useTheme();
    const [needToSendMessage, setNeedToSendMessage] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [url, setUrl] = useState("");
    const deleteFile = () => {
        setSelectedFile(null);
    }
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const validFileTypes = [
                "application/pdf",
                "text/plain",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ];
            if (file && validFileTypes.includes(file.type)) {
                setSelectedFile(file);
                setUrl(event.target.value);
            }
        }
    };

    useEffect(() => {
        if (needToSendMessage) {
            sendMessage();
            setNeedToSendMessage(false);
        }
    }, [needToSendMessage]);
    const contentIsString = typeof message.content === "string";
    const animation = !contentIsString ? " animated-box a" : "";
    const fixedUserMessage = message.role === "user" && message.content === "" ? "fixed-user-message" : "";
    const hover = !isUserPromptMessage ? "hover:": "";
    const prevUserMessage = !isUserPromptMessage && message.role === "user" ? " float-right !w-[70%]" : "";
    return (
        <div
            ref={rootRef}
            className={"leading-[0] sm:flex-row w-full "+ prevUserMessage +" gap-1 sm:gap-2 group "+ hover +"bg-slate-200 dark:"+ hover +"bg-slate-800 p-1 py-2 sm:p-2  rounded-lg items-baseline grow flex-1" + fixedUserMessage }
        >
            <div className="flex justify-between pr-1">
                {message.role !== "user" && (
                    <div
                        className={" mb-[10px] uppercase text-left group-hover:bg-slate-300 dark:group-hover:bg-slate-700 p-1 px-2 sm:p-2 rounded-lg text-sm" + animation}>
                        {message.role}
                    </div>)}

            </div>
            <span className="flex-1 w-full sm:w-auto h-full min-h-fit overflow-x-auto p-1">
        <div className="flex flex-col w-full flex-1 leading-normal">
          {/* simple text content */}
            {contentIsString && (
                <ContentArea
                    alwaysFocus={isUserPromptMessage}
                    role={message.role}
                    value={message.content}
                    onEnterPress={(e) => {
                        if (message.role === "user") {
                            if (e.shiftKey && e.key === "Enter") {
                                //do nothing
                            } else {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    deleteAfterMessage(index);
                                    setNeedToSendMessage(true);
                                }
                            }
                        }
                    }}
                    onChange={(value) => {
                        const newMessage = {...message, content: value};
                        setMessage(newMessage);
                    }}
                    autoFocus={message.role === "user" && message.content === ""}
                />
            )}
            {message.role === "system" && url === "" ? (
                    <label className="p-2 cursor-pointer">
                        <Paperclip
                            className="w-5 h-5 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"/>
                        <input
                            type="file"
                            hidden={true}
                            onChange={handleFileChange}
                        />
                    </label>)
                : (message.role === "system" &&
                    <div className="flex py-1">
                        <OcrFileEdit url={url} selectedFile={selectedFile} deleteFile={deleteFile}
                                     handleFileChange={handleFileChange}/>
                    </div>
                )}
            {/* tools */}
            {message.role === "assistant" &&
                message.tool_calls &&
                message.tool_calls.length > 0 && (
                    <ul className="flex flex-col gap-4 py-2">
                        {message.tool_calls.map((toolCall, index) => (
                            <li
                                key={index}
                                className="flex flex-col ring ring-slate-200 rounded-lg group-hover:ring-slate-300 dark:group-hover:ring-slate-600 dark:ring-slate-700 bg-white dark:bg-slate-900 focus-within:group-hover:ring-emerald-600 focus-within:ring-emerald-600 focus-within:ring-1 sm:focus-within:ring-2 overflow-hidden dark:focus-within:ring-emerald-600 dark:group-hover:focus-within:ring-emerald-600"
                            >
                                <div
                                    className="flex justify-between gap-2 bg-slate-10 border-b border-slate-300 dark:border-slate-700">
                                    <input
                                        type="text"
                                        placeholder="Enter selected tool name here."
                                        className="pl-2 p-1 bg-transparent border-none focus:border-none focus:ring-0 flex-1"
                                        value={toolCall.function.name}
                                        onChange={(e) => {
                                            const newMessage = {
                                                ...message,
                                                tool_calls: message.tool_calls?.map((t, idx) =>
                                                    idx === index
                                                        ? {
                                                            ...t,
                                                            function: {
                                                                ...t.function,
                                                                name: e.target.value,
                                                            },
                                                        }
                                                        : t
                                                ),
                                            };
                                            setMessage(newMessage);
                                        }}
                                        autoFocus={toolCall.function.name === ""}
                                    />
                                    <button
                                        title="Delete tool call"
                                        onClick={() => {
                                            const newMessage = {
                                                ...message,
                                                tool_calls: message.tool_calls?.filter(
                                                    (t, idx) => idx !== index
                                                ),
                                            };
                                            setMessage(newMessage);
                                        }}
                                        className="p-2"
                                    >
                                        <X className="w-5 h-5 text-slate-400 sm:text-slate-400 hover:text-slate-600 group-hover:text-slate-600 dark:hover:text-slate-400 dark:group-hover:text-slate-400"/>
                                    </button>
                                </div>
                                <CodeMirror
                                    basicSetup={{
                                        lineNumbers: false,
                                        foldGutter: false,
                                        highlightActiveLine: false,
                                        highlightSelectionMatches: false,
                                    }}
                                    className="bg-white dark:bg-slate-800 border border-transparent bg-transparent text-base"
                                    extensions={[json()]}
                                    placeholder="Enter selected tool call arguments here."
                                    value={toolCall.function.arguments}
                                    theme={theme === "dark" ? "dark" : "light"}
                                    onChange={(value) => {
                                        const newMessage = {
                                            ...message,
                                            tool_calls: message.tool_calls?.map((t, idx) =>
                                                idx === index
                                                    ? {
                                                        ...t,
                                                        function: {
                                                            ...t.function,
                                                            arguments: value,
                                                        },
                                                    }
                                                    : t
                                            ),
                                        };
                                        setMessage(newMessage);
                                    }}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            {message.role === "assistant" && (
                <div className="py-1 flex">
                    {/*{!message.content && message.content !== "" && (
                        <button
                            title="Add text content"
                            className="p-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center font-bold text-slate-400 dark:text-slate-600 sm:text-transparent dark:sm:text-transparent group-hover:text-slate-800 dark:group-hover:text-slate-400"
                            onClick={() => {
                                const newMessage = {
                                    ...message,
                                    content: "",
                                };
                                setMessage(newMessage);
                            }}
                        >
                            <Type className="w-5 h-5"/>
                        </button>
                    )}*/}
                    
                    <button
                        title="Copy to clipboard"
                        className="p-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center font-bold text-slate-400 dark:text-slate-600 sm:text-transparent dark:sm:text-transparent group-hover:text-slate-800 dark:group-hover:text-slate-400"
                        onClick={() => {
                            if(typeof message.content == "string") {
                                navigator.clipboard.writeText(message.content)
                            }
                        }}

                    >
                        <Clipboard className="w-5 h-5"/>
                    </button>
                </div>
            )}

            {/* multi-content */}
            {message.role === "user" &&
                message.content &&
                Array.isArray(message.content) && (
                    <ul className="flex flex-col w-full gap-4">
                        {message.content.map((item, index) => (
                            <li key={index}>
                                {item.type === "text" ? (
                                    <ContentArea
                                        alwaysFocus={isUserPromptMessage}
                                        role={message.role}
                                        value={item.text}
                                        onEnterPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        onChange={(value) => {
                                            if (typeof message.content === "string") return;
                                            const newMessage = {
                                                ...message,
                                                content: message.content.map((c, idx) =>
                                                    idx === index ? {...c, text: value} : c
                                                ),
                                            };
                                            setMessage(newMessage);
                                        }}
                                    />
                                ) : (
                                    <>
                                        <ImageEdit
                                            url={item.image_url.url}
                                            setUrl={(url: string) => {
                                                if (typeof message.content === "string") return;
                                                const newMessage = {
                                                    ...message,
                                                    content: message.content.map((c, idx) =>
                                                        idx === index ? {...c, image_url: {url}} : c
                                                    ),
                                                };
                                                setMessage(newMessage);
                                            }}
                                            deleteImage={() => {
                                                if (typeof message.content === "string") return;
                                                const newMessage = {
                                                    ...message,
                                                    content: message.content.filter(
                                                        (c, idx) => idx !== index
                                                    ),
                                                };
                                                setMessage(newMessage);
                                            }}
                                        />
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

            {message.role === "user" && (
                <div className="flex py-1">
                    {(typeof message.content === "string" ||
                        !(
                            Array.isArray(message.content) &&
                            message.content.find((c) => c.type === "image_url")
                        )) && (
                        <>
                        {isUserPromptMessage && (
                            <button
                                title="Add image content"
                                className="p-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center font-bold text-slate-400 dark:text-slate-600 sm:text-transparent dark:sm:text-transparent group-hover:text-slate-800 dark:group-hover:text-slate-400"
                                onClick={() => {
                                    const newMessage = {
                                        ...message,
                                        content: Array.isArray(message.content)
                                            ? message.content.concat([
                                                {
                                                    type: "image_url" as const,
                                                    image_url: {url: ""},
                                                },
                                            ])
                                            : [
                                                {type: "text" as const, text: message.content},
                                                {
                                                    type: "image_url" as const,
                                                    image_url: {url: ""},
                                                },
                                            ],
                                    };
                                    setMessage(newMessage);
                                }}
                            >
                                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                <Image className="w-5 h-5"/>
                            </button>
                        )}
                            {!isUserPromptMessage && (
                            <button onClick={deleteMessage}
                                    className="p-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center font-bold text-slate-400 dark:text-slate-600 sm:text-transparent dark:sm:text-transparent group-hover:text-slate-800 dark:group-hover:text-slate-400"
                            >
                                <Trash2
                                    className="w-5 h-5 text-transparent group-hover:text-slate-600 dark:group-hover:text-slate-400 hover:group-hover:text-slate-800 dark:hover:group-hover:text-slate-200"/>
                            </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
      </span>

        </div>
    );
};
export default ChatMessage;