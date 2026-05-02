import React from "react";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";

interface MarkdownComponentProps extends React.HTMLAttributes<HTMLElement> {
    node?: unknown;
    inline?: boolean;
    index?: number;
    href?: string;
    target?: string;
    rel?: string;
}

const reactMarkdownComponents = (theme: Record<string, React.CSSProperties>) => ({
    h1: ({children}: MarkdownComponentProps) => (
        <h1 className="text-2xl font-bold">{children}</h1>
    ),
    h2: ({children}: MarkdownComponentProps) => (
        <h2 className="text-xl font-bold">{children}</h2>
    ),
    h3: ({children}: MarkdownComponentProps) => (
        <h3 className="text-lg font-bold">{children}</h3>
    ),
    ul: ({children}: MarkdownComponentProps) => (
        <ul className="list-disc pl-8 inline-flex flex-col">{children}</ul>
    ),
    ol: ({children}: MarkdownComponentProps) => (
        <ol className="list-decimal pl-8 inline-flex flex-col">{children}</ol>
    ),
    li: ({children}: MarkdownComponentProps) => (
        <li>{children}</li>
    ),
    a: ({children, href, target, rel, ...rest}: MarkdownComponentProps) => (
        <a
            className="text-blue-500 hover:underline cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
            href={href}
            {...rest}
        >
            {children}
        </a>
    ),
    table: ({children}: MarkdownComponentProps) => (
        <table className="w-full">{children}</table>
    ),
    thead: ({children}: MarkdownComponentProps) => (
        <thead className="text-slate-500 dark:text-slate-400">{children}</thead>
    ),
    code: ({children, className, node, ...rest}: MarkdownComponentProps) => {
        const match = /language-(\w+)/.exec(className || "");
        const copyText = String(children).replace(/\n$/, "");

        return match ? (
            <span className="block">
                <SyntaxHighlighter
                    style={theme}
                    PreTag="div"
                    language={match[1]}
                    wrapLines
                    wrapLongLines
                >
                    {copyText}
                </SyntaxHighlighter>
            </span>
        ) : (
            <code className={className || "font-bold whitespace-pre-wrap"} {...rest}>
                {children}
            </code>
        );
    },
});
export default reactMarkdownComponents;
