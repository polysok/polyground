import React, {useEffect, useRef} from "react";

const ResizeableTextarea = (props: any) => {
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    useEffect(() => {
        if (textAreaRef.current && props.autoFocus) {
            textAreaRef.current.focus();
        }
    }, [textAreaRef, props.autoFocus]);
    useEffect(() => {
        if (textAreaRef.current) {
            const target = textAreaRef.current;
            target.style.height = "0px";
            const height = target.scrollHeight + 3;
            target.style.height = `${height}px`;
        }
    });
    return <textarea ref={textAreaRef} rows={1} {...props} />;
};
export default ResizeableTextarea;