"use client";

import {useState} from "react";

import Markdown from "react-markdown";
import {
    oneLight as light,
    oneDark as dark,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css"; // `rehype-katex` does not import the CSS for you

import {
    ChatCompletionRole
} from "openai/resources/chat/index";

import React from "react";

import {useTheme} from "next-themes";
import ResizeableTextarea from "@/components/resizeable-textarea";
import reactMarkdownComponents from "@/components/react-markdown-component";
import OpenAI from "openai";
import ChatCompletionContentPart = OpenAI.ChatCompletionContentPart;

const ContentArea = ({
                         role, // TODO: should probably just be placeholder
                         value,
                         onChange,
                         onEnterPress,
                         autoFocus = false,
                         alwaysFocus = false,
                     }: {
    role: ChatCompletionRole;
    value: string | ChatCompletionContentPart[] | undefined | null;
    onChange: (value: string) => void;
    onEnterPress: (e: React.KeyboardEvent) => void;
    autoFocus?: boolean;
    alwaysFocus: boolean;
}) => {
    const [editing, setEditing] = useState(autoFocus || false);
    const {theme} = useTheme();
    
    return (
        <>
            {role !== "assistant" ? (
                <ResizeableTextarea
                    value={value}
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        onEnterPress(e);
                    }}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        onChange(e.target.value);
                    }}
                    placeholder={`Enter a ${role} message here...`}
                    className="disabled:hidden block w-full text-left p-1 px-2 sm:p-2 whitespace-pre-wrap focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 border outline-none focus:border-none rounded-lg resize-none group-hover:bg-white dark:group-hover:bg-slate-900 bg-white dark:bg-slate-900 dark:focus:bg-slate-900 bg-transparent border-slate-200 dark:border-slate-800"
                    autoFocus
                    onBlur={() => {
                        setEditing(false);
                    }}
                />
            ) : (
                <div
                    
                    className="text-left p-1 px-2 sm:p-2 group-hover:bg-white dark:group-hover:bg-slate-900 rounded-lg cursor-text w-full border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900 bg-white"
                >
                    {value ? (
                        <Markdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={reactMarkdownComponents(
                                theme === "dark" ? dark : light
                            )}
                            className="whitespace-pre-wrap overflow-x-auto flex flex-col gap-2"
                        >
                            {value}
                        </Markdown>
                    ) : (
                        <div className="text-slate-400 dark:text-slate-500">
                            {`Enter a ${role} message here.`}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
export default ContentArea;