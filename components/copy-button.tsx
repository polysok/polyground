import React, {useEffect, useState} from "react";
import {Clipboard, ClipboardCheck} from "lucide-react";

async function copyToClipboard(textToCopy: string) {
    // Navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
    } else {
        // Use the 'out of viewport hidden text area' trick
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;

        // Move textarea out of the viewport so it's not visible
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";

        document.body.prepend(textArea);
        textArea.select();

        try {
            document.execCommand("copy");
        } catch (error) {
            console.error(error);
        } finally {
            textArea.remove();
        }
    }
}
const CopyButton = ({value}: { value: string | (() => string) }) => {
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => {
                setCopied(false);
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);
    return (
        <button
            className="focus:outline-none"
            onClick={async () => {
                setCopied(true);
                await copyToClipboard(typeof value === "function" ? value() : value);
            }}
            title="Copy to clipboard"
        >
            {copied ? (
                <ClipboardCheck className="w-5 h-5"/>
            ) : (
                <Clipboard className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-400"/>
            )}
        </button>
    );
};
export default CopyButton;