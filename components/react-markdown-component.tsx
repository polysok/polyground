import React from "react";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";

const reactMarkdownComponents = (theme: {
    [key: string]: React.CSSProperties;
}) => ({
    h1: (props: any) => {
        const {children, ...rest} = props;
        return <h1 className="text-2xl font-bold">{children}</h1>;
    },
    h2: (props: any) => {
        const {children, ...rest} = props;
        return <h2 className="text-xl font-bold">{children}</h2>;
    },
    h3: (props: any) => {
        const {children, ...rest} = props;
        return <h3 className="text-lg font-bold">{children}</h3>;
    },
    // list
    ul: (props: any) => {
        const {children, ...rest} = props;
        return <ul className="list-disc pl-8 inline-flex flex-col">{children}</ul>;
    },
    ol: (props: any) => {
        const {children, ...rest} = props;
        return (
            <ol className="list-decimal pl-8 inline-flex flex-col">{children}</ol>
        );
    },
    li: (props: any) => {
        const {children, ...rest} = props;
        return <li>{children}</li>;
    },
    // links
    a: (props: any) => {
        const {children, ...rest} = props;
        return (
            <a className="text-blue-500 hover:underline cursor-pointer" {...rest}>
                {children}
            </a>
        );
    },
    // tables
    table: (props: any) => {
        const {children, ...rest} = props;
        return <table className="w-full">{children}</table>;
    },
    thead: (props: any) => {
        const {children, ...rest} = props;
        return (
            <thead className="text-slate-500 dark:text-slate-400">{children}</thead>
        );
    },

    // code
    code: (props: any) => {
        const {children, className, ...rest} = props;
        const match = /language-(\w+)/.exec(className || "");
        const copyText = String(children).replace(/\n$/, "");

        return (
            <>
                {match ? (
                    <span className="block">
            <SyntaxHighlighter
                style={theme}
                {...rest}
                PreTag="div"
                language={match[1]}
                wrapLines
                wrapLongLines
            >
              {copyText}
            </SyntaxHighlighter>
          </span>
                ) : (
                    <code
                        {...rest}
                        className={className || "font-bold whitespace-pre-wrap"}
                    >
                        {children}
                    </code>
                )}
            </>
        );
    },
});
export default reactMarkdownComponents;