import React, {useEffect, useState} from "react";
import {Check, Paperclip, Pencil, X} from "lucide-react";

const ImageEdit = ({
                       url,
                       setUrl,
                       deleteImage,
                   }: {
    url: string;
    setUrl: (url: string) => void;
    deleteImage: () => void;
}) => {
    const [editing, setEditing] = useState(url === "");
    useEffect(() => {
        document.onpaste = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) return;
            for (const index in items) {
                const item = items[index];
                if (item.kind === "file") {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        setUrl(event.target?.result as string);
                        setEditing(false);
                    }; // data url!
                    if (blob) {
                        reader.readAsDataURL(blob);
                    }
                }
            }
        };
    }, [url, setUrl]);
    useEffect(() => {
        if (url === "") {
            setEditing(true);
        }
    }, [url, setEditing]);
    return (
        <>
            {!editing ? (
                <div className="w-full h-full relative px-2 group">
                    <div className="absolute top-0 right-0 px-2 group-hover:opacity-100 opacity-20">
                        <button
                            className="text-white z-50 bg-black p-4"
                            onClick={() => {
                                setEditing(true);
                                // setUrl("");
                            }}
                        >
                            <Pencil className="w-5 h-5"/>
                        </button>
                        <button
                            className="text-white z-50 bg-black p-4"
                            onClick={() => {
                                deleteImage();
                            }}
                        >
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="max-h-[35rem]"/>
                </div>
            ) : (
                <div className="flex items-center">
                    {/* url input */}
                    <input
                        type="text"
                        className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter image URL or paste image here."
                        autoFocus={true}
                    />
                    {/* file input */}
                    <label className="p-2 cursor-pointer">
                        <Paperclip
                            className="w-5 h-5 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"/>
                        <input
                            type="file"
                            hidden={true}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                // check file is (png, jpg, jpeg, webp, or gif)
                                const validImageTypes = [
                                    "image/png",
                                    "image/jpeg",
                                    "image/jpg",
                                    "image/webp",
                                    "image/gif",
                                ];
                                if (file && validImageTypes.includes(file.type)) {
                                    // create base64 data url
                                    const reader = new FileReader();
                                    reader.onload = function (event) {
                                        setUrl(event.target?.result as string);
                                        setEditing(false);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </label>
                    {url && (
                        <button
                            onClick={() => {
                                setEditing(false);
                            }}
                            className="p-2 dark:text-slate-400 dark:hover:text-slate-300"
                        >
                            <Check className="w-5 h-5"/>
                        </button>
                    )}
                    {/* delete button */}
                    <button
                        onClick={() => {
                            deleteImage();
                        }}
                        className="p-2 dark:text-slate-400 dark:hover:text-slate-300"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                </div>
            )}
        </>
    );
};
export default ImageEdit;