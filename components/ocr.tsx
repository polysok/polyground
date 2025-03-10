import React, {useEffect, useState} from 'react';
import Tesseract from 'tesseract.js';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

import {Check, Eye, Paperclip, Pencil, X, LoaderCircleIcon} from "lucide-react";

const OcrFileEdit = ({
                        url,
                        selectedFile, 
                        deleteFile,
                        handleFileChange
                    }:{
                        url:string,
                        selectedFile:File|null,
                        deleteFile: () => void,
                        handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => 
{
    const [ocrResult, setOcrResult] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const handleInternalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setOcrResult('');
            handleFileChange(e);
    }
    const handleOcr = async () => {
        if (selectedFile) {
            setLoading(true);
            const fileReader = new FileReader();
            fileReader.onload = async () => {
                const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
                const pdf = await pdfjs.getDocument(typedArray).promise;
                const numPages = pdf.numPages;
                var resultString: string = "";
               
                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport }).promise;
                    const imageData = canvas.toDataURL('image/png');

                    const { data: { text } } = await Tesseract.recognize(imageData, 'eng', {
                        logger: (m) => console.log(m),
                    });
                    resultString += "\n" + text;
                }

                setOcrResult(resultString);
                setLoading(false);
            };
            fileReader.readAsArrayBuffer(selectedFile);
        }
    };
    
    return (
        <>
                <div className="flex items-center">
                    {/* url input */}
                    <input
                        type="text"
                        className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                        value={url}
                        onChange={handleFileChange}
                        placeholder="Enter file URL here."
                        autoFocus={true}
                    />
                    {/* file input */}
                    <label className="p-2 cursor-pointer">
                        <Paperclip
                            className="w-5 h-5 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"/>
                        <input
                            type="file"
                            hidden={true}
                            onChange={handleInternalFileChange}
                        />
                    </label>
                    {!ocrResult ? (
                    <button className="p-2 dark:text-slate-400 dark:hover:text-slate-300"
                            disabled={!selectedFile || loading}
                            onClick={handleOcr}
                    >
                        {!loading ? (
                            <Eye className="w-5 h-5 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                            />
                        ) : (
                            <LoaderCircleIcon className="loading-icon w-5 h-5 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                            />
                        )}
                    </button>):(
                        <>
                            <Check className="w-10 h-10"/>
                            <input type="hidden" id="ocrcontent" value={ocrResult}/>
                        </>
                    )}
                    {/* delete button */}
                    <button
                        onClick={() => {
                            deleteFile();
                        }}
                        className="p-2 dark:text-slate-400 dark:hover:text-slate-300"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                </div>
        </>
    );
};
export default OcrFileEdit;