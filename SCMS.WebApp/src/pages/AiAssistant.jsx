import {
  MagicWandIcon,
  PaperPlaneIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircledIcon,
  PlayIcon,
  CodeIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";
import { mcpApi } from "../services/scmsApi";
import { useLanguage } from "../context/LanguageContext";

const renderMessageContent = (content) => {
  if (!content) return null;

  // Auto-translate yyyy-MM-dd dates to dd-MM-yyyy format
  const formattedContent = content.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, "$3-$2-$1");
  const lines = formattedContent.split("\n");

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
    let lineContent = line;
    if (isBullet) {
      const bulletIndex = line.indexOf(trimmed.startsWith("* ") ? "* " : "- ");
      lineContent = line.substring(bulletIndex + 2);
    }

    const parts = [];
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(lineContent)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(lineContent.substring(lastIndex, matchIndex));
      }
      parts.push(
        <strong key={matchIndex} className="font-extrabold text-slate-900 dark:text-white">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < lineContent.length) {
      parts.push(lineContent.substring(lastIndex));
    }

    const contentNode = parts.length > 0 ? parts : lineContent;

    if (isBullet) {
      return (
        <ul key={lineIdx} className="list-disc pl-5 my-0.5">
          <li className="font-medium text-slate-700 dark:text-slate-200">{contentNode}</li>
        </ul>
      );
    }

    return (
      <p key={lineIdx} className="min-h-[1.25rem] font-medium text-slate-700 dark:text-slate-200">
        {contentNode}
      </p>
    );
  });
};

export default function AiAssistant() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: "model",
      content:
        language === "mm"
          ? "မင်္ဂလာပါ! ကျွန်တော်ကတော့ ကုမယ် AI အကူအညီပေးသူ ဖြစ်ပါတယ်။ ဆေးခန်းလည်ပတ်မှုတွေ၊ ချိန်းဆိုမှုတွေနဲ့ ဆေးဝါးလက်ကျန်တွေကို ရှာဖွေစုံစမ်းဖို့ ဘယ်လိုကူညီပေးရမလဲခင်ဗျာ။"
          : "Hello! I am your intelligent assistant. How can I help you manage clinic operations, reschedule appointments, or check inventory levels today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolInputs, setToolInputs] = useState({});
  const [toolResponse, setToolResponse] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingTools, setLoadingTools] = useState(false);
  const [loadingToolCall, setLoadingToolCall] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {
    loadTools();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingChat]);

  const loadTools = async () => {
    try {
      setLoadingTools(true);
      setError("");
      const res = await mcpApi.tools();
      if (res?.isSuccess) {
        setTools(res.data || []);
      } else {
        setError(res?.message || "Failed to load MCP tools.");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to AI backend.");
    } finally {
      setLoadingTools(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || loadingChat) return;

    const nextMessages = [...messages, { role: "user", content: query }];
    setMessages(nextMessages);
    setInput("");
    setLoadingChat(true);

    try {
      const res = await mcpApi.chat({
        messages: nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      if (res?.isSuccess && res.data?.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: res.data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: "Sorry, I encountered an issue processing that request. Please try again.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: `Error: ${err?.response?.data?.message || err?.message || "Could not connect to Gemini AI."}`,
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    setToolResponse(null);
    const initialInputs = {};
    if (tool?.inputSchema?.properties) {
      Object.keys(tool.inputSchema.properties).forEach((k) => {
        initialInputs[k] = "";
      });
    }
    setToolInputs(initialInputs);
  };

  const handleToolInput = (key, val) => {
    setToolInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handleCallTool = async () => {
    if (!selectedTool || loadingToolCall) return;
    setLoadingToolCall(true);
    setToolResponse(null);

    try {
      const parsedArgs = {};
      const props = selectedTool.inputSchema?.properties || {};

      Object.entries(toolInputs).forEach(([k, v]) => {
        if (v === "") return;
        const type = props[k]?.type;
        if (type === "number" || type === "integer") {
          parsedArgs[k] = Number(v);
        } else if (type === "boolean") {
          parsedArgs[k] = v === "true" || v === true;
        } else {
          parsedArgs[k] = v;
        }
      });

      const res = await mcpApi.callTool({
        name: selectedTool.name,
        arguments: parsedArgs,
      });

      if (res?.isSuccess) {
        setToolResponse(res.data);
      } else {
        setToolResponse({ isError: true, error: res?.message || "Execution failed" });
      }
    } catch (err) {
      setToolResponse({ isError: true, error: err?.message || "Error calling tool" });
    } finally {
      setLoadingToolCall(false);
    }
  };

  const quickPrompts = [
    {
      label: language === "mm" ? "ဆေးလက်ကျန်သတိပေးချက်များ" : "Stock alerts",
      prompt: "Show me all critical medicine stock alerts.",
    },
    {
      label: language === "mm" ? "ယနေ့လူနာအချိန်းအဆိုများ" : "Today appointments",
      prompt: "What appointments are scheduled for today?",
    },
    {
      label: language === "mm" ? "အဆုတ်ပန်းနာအတွက် ဆေးညွှန်းပုံစံ" : "Asthma prescription template",
      prompt: "What standard prescription templates do we have for Asthma?",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] animate-fadeIn">
      {/* Chat Window */}
      <section className="flex h-[calc(100vh-140px)] flex-col rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <MagicWandIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              {language === "mm" ? "AI ဆေးခန်းအကူ" : "AI Operations Assistant"}
            </h1>
            <p className="text-xs text-slate-500">
              Powered by Gemini & Model Context Protocol (MCP)
            </p>
          </div>
          <button
            onClick={() => setMessages([messages[0]])}
            className="ml-auto scms-btn-outline p-1.5 h-8 min-h-8 w-8 btn-target"
            title="Reset Chat"
          >
            <ReloadIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white shrink-0 ${
                  msg.role === "user" ? "bg-indigo-600" : "bg-purple-600"
                }`}
              >
                {msg.role === "user" ? "U" : "AI"}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none"
                }`}
              >
                <div className="space-y-1">{renderMessageContent(msg.content)}</div>
              </div>
            </div>
          ))}
          {loadingChat && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white bg-purple-600 shrink-0 animate-pulse">
                AI
              </div>
              <div className="rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm">
                <span className="loading loading-dots loading-xs" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => setInput(qp.prompt)}
                className="rounded-full border border-purple-200 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/40 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition btn-target"
              >
                {qp.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="relative mt-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === "mm" ? "မေးမြန်းလိုသောအချက် ရေးပါ..." : "Ask AI to check stock, query diagnoses..."
            }
            className="scms-input w-full pr-14 pl-4 text-xs"
            disabled={loadingChat}
          />
          <button
            type="submit"
            disabled={!input.trim() || loadingChat}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors btn-target"
          >
            <PaperPlaneIcon className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>

      {/* MCP Tools Sidebar */}
      <section className="flex h-[calc(100vh-140px)] flex-col rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <CodeIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {language === "mm" ? "အလိုအလျောက် လုပ်ဆောင်ချက်များ" : "MCP Tool Center"}
            </h2>
            <p className="text-xs text-slate-500">Live backend integration endpoints</p>
          </div>
          <button
            onClick={loadTools}
            className="ml-auto scms-btn-outline p-1.5 h-8 min-h-8 w-8 btn-target"
            title="Reload Tools"
          >
            <ReloadIcon className={`w-3.5 h-3.5 ${loadingTools ? "animate-spin" : ""}`} />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 text-xs font-bold text-rose-700 dark:text-rose-300">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Tools Selector */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {loadingTools ? (
            <div className="grid place-items-center h-40">
              <span className="loading loading-spinner loading-md text-indigo-600 dark:text-indigo-400" />
            </div>
          ) : tools.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs font-semibold">
              <QuestionMarkCircledIcon className="w-8 h-8 mb-2 opacity-40" />
              No backend tools found. Please check API status.
            </div>
          ) : (
            tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleToolSelect(tool)}
                className={`w-full text-left rounded-2xl border p-3.5 transition btn-target ${
                  selectedTool?.name === tool.name
                    ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    TOOL
                  </div>
                  <strong className="text-xs font-bold text-slate-900 dark:text-white">
                    {tool.name}
                  </strong>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {tool.description}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Tool Playground Modal/Footer */}
        {selectedTool && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Playground: <span className="text-indigo-600 dark:text-indigo-400 font-mono">{selectedTool.name}</span>
              </div>
              <button
                onClick={() => setSelectedTool(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 btn-target"
              >
                Clear
              </button>
            </div>

            {/* Dynamic Inputs */}
            {selectedTool.inputSchema?.properties && (
              <div className="space-y-2.5 max-h-[140px] overflow-y-auto mb-3 pr-1">
                {Object.entries(selectedTool.inputSchema.properties).map(([k, prop]) => (
                  <label key={k} className="block text-xs">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {k} {prop.type ? `(${prop.type})` : ""}
                    </span>
                    <input
                      type="text"
                      className="scms-input w-full text-xs h-8"
                      value={toolInputs[k] || ""}
                      onChange={(e) => handleToolInput(k, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            )}

            <button
              onClick={handleCallTool}
              disabled={loadingToolCall}
              className="scms-btn-primary min-h-9 h-9 w-full flex items-center justify-center gap-2 text-xs font-bold btn-target"
            >
              {loadingToolCall ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <>
                  <PlayIcon className="w-3.5 h-3.5" />
                  <span>Execute Tool</span>
                </>
              )}
            </button>

            {toolResponse && (
              <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 p-3 text-xs font-mono max-h-[140px] overflow-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-1.5 mb-1.5">
                  <CodeIcon className="w-3.5 h-3.5" />
                  <span>Output</span>
                </div>
                {toolResponse.isError ? (
                  <div className="text-rose-600 font-semibold">{toolResponse.error}</div>
                ) : (
                  <pre className="text-slate-800 dark:text-slate-200 text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(toolResponse, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
