import React, {useCallback, useRef, useState} from "react";
import {Dialog} from "@headlessui/react";
import {X} from "lucide-react";

const useLocalStorage = <T, >({
                                  key,
                                  initialValue,
                                  serialize,
                                  deserialize,
                              }: {
    key: string;
    initialValue: T;
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
}) => {
    const current = localStorage.getItem(key);
    if (current === null) {
        localStorage.setItem(key, serialize(initialValue));
    }
    const [value, setValue] = useState<T>(
        current ? deserialize(current) : initialValue
    );
    const save = useCallback(() => {
        localStorage.setItem(key, serialize(value));
    }, [key, value, serialize]);
    const reset = useCallback(() => {
        setValue(initialValue);
    }, [initialValue]);
    const reload = useCallback(() => {
        const item = localStorage.getItem(key);
        if (item) {
            setValue(deserialize(item));
        } else {
            setValue(initialValue);
        }
    }, [key, initialValue, deserialize]);
    return {value, setValue, save, reset, reload};
};

const useLocalStorageString = (key: string, initialValue: string) => {
    return useLocalStorage({
        key,
        initialValue,
        serialize: (value) => value,
        deserialize: (value) => value,
    });
};
const SettingsDialog = ({
                            settingsOpen,
                            setSettingsOpen,
                        }: {
    settingsOpen: boolean;
    setSettingsOpen: (settingsOpen: boolean) => void;
}) => {
    const apiKey = useLocalStorageString("apiKey", "");
    const baseURL = useLocalStorageString("baseURL", "");

    const baseURLRef = useRef<HTMLInputElement | null>(null);

    return (
        <Dialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            className="relative z-50"
            initialFocus={baseURLRef}
        >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true"/>
            <div
                className="fixed inset-0 flex w-screen items-start sm:items-center justify-center p-0 sm:p-4 max-h-dvh">
                <Dialog.Panel
                    className="shadow-xl rounded-b-lg sm:rounded-lg p-4 border max-w-none sm:max-w-xl w-full gap-2 bg-white dark:bg-slate-900 max-h-full flex flex-col">
                    <div>
                        <div className="w-full flex justify-between">
                            <Dialog.Title className="font-bold text-lg">
                                Settings
                            </Dialog.Title>
                            <button
                                className="focus:outline-none text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-400"
                                onClick={() => setSettingsOpen(false)}
                            >
                                <X className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-400"/>
                            </button>
                        </div>
                        <Dialog.Description className="text-slate-500 dark:text-slate-400">
                            Configure settings for the chat playground.
                        </Dialog.Description>
                    </div>

                    <div className="flex flex-col gap-4 py-4 pb-8">
                        {/* base url */}
                        <div className="w-full">
                            <label
                                htmlFor="base-url"
                                className="text-slate-800 dark:text-slate-400 text-sm font-bold"
                            >
                                Base URL
                            </label>
                            <input
                                value={baseURL.value}
                                onChange={(e) => baseURL.setValue(e.target.value)}
                                type="url"
                                className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                                placeholder="Enter the base URL for the server or leave blank for OpenAI"
                                ref={baseURLRef}
                            />
                        </div>
                        {/* api key */}
                        <div className="w-full">
                            <label
                                htmlFor="api-key"
                                className="text-slate-800 dark:text-slate-400 text-sm font-bold"
                            >
                                API Key
                            </label>
                            <input
                                value={apiKey.value}
                                onChange={(e) => apiKey.setValue(e.target.value)}
                                type="password"
                                className="w-full p-1 sm:p-2 focus:ring-emerald-600 focus:ring-1 sm:focus:ring-2 rounded-lg border border-slate-200 focus:border-slate-200 dark:border-slate-700 dark:focus:border-slate-700 dark:bg-slate-900"
                                placeholder="Enter the API key for the OpenAI API"
                            />
                        </div>
                    </div>
                    <button
                        className="px-4 py-2 w-full sm:w-auto rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white focus:outline-none"
                        onClick={() => {
                            apiKey.save();
                            baseURL.save();
                            setSettingsOpen(false);
                        }}
                    >
                        Save
                    </button>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};
export default SettingsDialog;