import React, {useEffect, useRef} from "react";

interface ResizeableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    autoFocus?: boolean;
}

const ResizeableTextarea = ({autoFocus, ...props}: ResizeableTextareaProps) => {
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    useEffect(() => {
        if (textAreaRef.current && autoFocus) {
            textAreaRef.current.focus();
        }
    }, [autoFocus]);
    useEffect(() => {
        if (textAreaRef.current) {
            const target = textAreaRef.current;
            target.style.height = "0px";
            const height = target.scrollHeight + 3;
            target.style.height = `${height}px`;
        }
    }, [props.value]);
    return <textarea ref={textAreaRef} rows={1} {...props} />;
};
export default ResizeableTextarea;
