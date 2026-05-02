import OpenAI from "openai";
import {
    ChatCompletionMessageParam,
    ChatCompletionTool,
    ChatCompletionToolChoiceOption,
} from "openai/resources/chat/index";
import {Stream} from "openai/streaming.mjs";

export interface ChatSettings {
    model: string;
    seed: number;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    maxTokens: number;
    stop: string[];
    jsonMode: boolean;
    stream: boolean;
}

function createOpenAIClient(): OpenAI {
    const baseURL = localStorage.getItem("baseURL") || "";
    const apiKey = localStorage.getItem("apiKey") || "";
    return new OpenAI({
        baseURL: baseURL === "" ? undefined : baseURL,
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
    });
}

export const listModels = async (): Promise<string[]> => {
    try {
        const openai = createOpenAIClient();
        const lst = await openai.models.list();
        return lst.data.map((modelName) => modelName.id);
    } catch (error) {
        console.error("Failed to list models:", error);
        return [];
    }
};

export const createChatCompletion = (
    messages: ChatCompletionMessageParam[],
    settings: ChatSettings,
    tools: ChatCompletionTool[],
    toolChoice: ChatCompletionToolChoiceOption,
    {signal}: { signal: AbortSignal }
) => {
    const openai = createOpenAIClient();
    return openai.chat.completions.create(
        {
            messages,
            tools: tools.length > 0 ? tools : undefined,
            tool_choice:
                toolChoice !== "auto" && tools.length > 0 ? toolChoice : undefined,
            model: settings.model,
            seed: settings.seed < 0 ? undefined : settings.seed,
            temperature: settings.temperature,
            max_tokens: settings.maxTokens < 0 ? undefined : settings.maxTokens,
            stop: settings.stop.length > 0 ? settings.stop : undefined,
            frequency_penalty: settings.frequencyPenalty,
            presence_penalty: settings.presencePenalty,
            stream: settings.stream,
            response_format: settings.jsonMode ? {type: "json_object"} : undefined,
            top_p: settings.topP,
        },
        {
            signal,
        }
    );
};
