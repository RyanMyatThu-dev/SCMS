import {
  Sparkles,
  Send,
  Wand2,
  AlertCircle,
  HelpCircle,
  Play,
  CheckCircle2,
  Terminal,
  RefreshCw,
  Info,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { mcpApi } from "../services/scmsApi";
import { useLanguage } from "../context/LanguageContext";

export default function AiAssistant() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: "model",
      content:
        language === "mm"
          ? "မင်္ဂလာပါ! ကျွန်တော်ကတော့ SCMS AI အကူအညီပေးသူ ဖြစ်ပါတယ်။ ဆေးခန်းလည်ပတ်မှုတွေ၊ ချိန်းဆိုမှုတွေနဲ့ ဆေးဝါးလက်ကျန်တွေကို ရှာဖွေစုံစမ်းဖို့ ဘယ်လိုကူညီပေးရမလဲခင်ဗျာ။"
          : "Hello! I am your intelligent SCMS assistant. How can I help you manage clinic operations, reschedule appointments, or check inventory levels today?",
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
      // Cast inputs to correct types if needed (e.g. number for IDs)
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
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      {/* --- Chat Window --- */}
      <section className="flex h-[calc(100vh-140px)] flex-col rounded-3xl border border-scms-border bg-white p-4 shadow-scms shadow-indigo-50/50">
        <div className="flex items-center gap-3 border-b border-scms-border pb-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-md font-black text-scms-text">
              {language === "mm" ? "AI ဆေးခန်းအကူ" : "AI Operations Assistant"}
            </h1>
            <p className="text-xs font-semibold text-scms-muted">
              Powered by Gemini & Model Context Protocol (MCP)
            </p>
          </div>
          <button
            onClick={() => setMessages([messages[0]])}
            className="ml-auto btn btn-ghost btn-sm btn-circle"
            title="Reset Chat"
          >
            <RefreshCw size={15} />
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
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-black text-white shrink-0 ${
                  msg.role === "user" ? "bg-scms-primary" : "bg-purple-600"
                }`}
              >
                {msg.role === "user" ? "U" : "AI"}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  msg.role === "user"
                    ? "bg-scms-primary text-white rounded-tr-none"
                    : "bg-[#F2F4F7] text-scms-text rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-line font-medium">{msg.content}</div>
              </div>
            </div>
          ))}
          {loadingChat && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-black text-white bg-purple-600 shrink-0 animate-pulse">
                AI
              </div>
              <div className="rounded-2xl rounded-tl-none bg-[#F2F4F7] px-4 py-3 text-sm text-scms-text">
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
                className="rounded-full border border-purple-200 bg-purple-50/50 px-3 py-1.5 text-xs font-extrabold text-purple-700 hover:bg-purple-50 transition"
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
              language === "mm" ? "မေးမြန်းလိုသောအချက် ရေးပါ..." : "Ask AI to check stock, reschedule visits..."
            }
            className="scms-input w-full pr-14 pl-4"
            disabled={loadingChat}
          />
          <button
            type="submit"
            disabled={!input.trim() || loadingChat}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-scms-primary text-white hover:bg-scms-primaryDark disabled:bg-[#EAECF0] disabled:text-[#98A2B3] transition-colors"
          >
            <Send size={15} />
          </button>
        </form>
      </section>

      {/* --- MCP Console / Sidebar --- */}
      <section className="flex h-[calc(100vh-140px)] flex-col rounded-3xl border border-scms-border bg-white p-4 shadow-scms">
        <div className="flex items-center gap-3 border-b border-scms-border pb-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Terminal size={20} />
          </div>
          <div>
            <h2 className="text-md font-black text-scms-text">
              {language === "mm" ? "အလိုအလျောက် လုပ်ဆောင်ချက်များ" : "MCP Tool Center"}
            </h2>
            <p className="text-xs font-semibold text-scms-muted">
              Live backend integration controllers
            </p>
          </div>
          <button onClick={loadTools} className="ml-auto btn btn-ghost btn-xs btn-square" title="Reload Tools">
            <RefreshCw size={12} className={loadingTools ? "animate-spin" : ""} />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Tools Selector */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3">
          {loadingTools ? (
            <div className="grid place-items-center h-40">
              <span className="loading loading-spinner loading-md text-scms-primary" />
            </div>
          ) : tools.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-scms-muted text-xs font-semibold">
              <HelpCircle size={36} className="mb-2 opacity-40" />
              No backend tools found. Please check Api Status.
            </div>
          ) : (
            tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleToolSelect(tool)}
                className={`w-full text-left rounded-2xl border p-3.5 transition ${
                  selectedTool?.name === tool.name
                    ? "border-scms-primary bg-scms-primaryLight/30"
                    : "border-scms-border hover:bg-[#F9FAFB]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-indigo-100/60 px-2 py-0.5 text-[10px] font-black text-indigo-700 font-mono">
                    TOOL
                  </div>
                  <strong className="text-xs font-black text-scms-text">{tool.name}</strong>
                </div>
                <p className="mt-2 text-xs leading-5 text-scms-muted font-medium">
                  {tool.description}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Tool Playground Modal/Footer */}
        {selectedTool && (
          <div className="border-t border-scms-border pt-4 mt-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-black text-scms-text">
                Playground: <span className="text-indigo-600 font-mono">{selectedTool.name}</span>
              </div>
              <button
                onClick={() => setSelectedTool(null)}
                className="text-xs font-extrabold text-scms-muted hover:text-scms-text"
              >
                Clear
              </button>
            </div>

            {/* Dynamic Inputs */}
            {selectedTool.inputSchema?.properties && (
              <div className="space-y-3 max-h-[160px] overflow-y-auto mb-3">
                {Object.entries(selectedTool.inputSchema.properties).map(([k, prop]) => (
                  <label key={k} className="block">
                    <span className="block text-[10px] font-extrabold text-scms-muted uppercase mb-1">
                      {k} {prop.type ? `(${prop.type})` : ""} {prop.description ? `- ${prop.description}` : ""}
                    </span>
                    <input
                      type="text"
                      className="input input-bordered input-sm h-8 rounded-lg text-xs w-full"
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
              className="scms-btn-primary min-h-9 h-9 w-full flex items-center justify-center gap-2 text-xs font-bold"
            >
              {loadingToolCall ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <>
                  <Play size={12} />
                  Execute Tool
                </>
              )}
            </button>

            {toolResponse && (
              <div className="mt-3 rounded-xl border border-scms-border bg-[#F8F9FC] p-3 text-xs font-mono max-h-[150px] overflow-auto">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#344054] border-b border-scms-border pb-1.5 mb-1.5">
                  <Terminal size={12} />
                  Result Output
                </div>
                {toolResponse.isError ? (
                  <div className="text-scms-danger">{toolResponse.error}</div>
                ) : (
                  <pre className="text-scms-text text-[11px] leading-5 whitespace-pre-wrap">
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
