import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

import {
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaMicrophone,
  FaMoon,
  FaSun,
  FaCopy,
  FaBars,
  FaPlus,
} from "react-icons/fa";

import {
  Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";

import {
  oneDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://gen-ai-chatbot-production-79db.up.railway.app";

type Message = {
  role: string;
  content: string;
  time: string;
};

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function App() {

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(false);

  const [darkMode, setDarkMode] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const saved = localStorage.getItem(
      "chat_history"
    );

    if (saved) {
      setMessages(JSON.parse(saved));
    }

  }, []);

  useEffect(() => {

    localStorage.setItem(
      "chat_history",
      JSON.stringify(messages)
    );

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);

  const askAI = async (prompt?: string) => {

    const finalQuestion = prompt || question;

    if (!finalQuestion.trim()) return;

    const userMessage = {
      role: "user",
      content: finalQuestion,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setQuestion("");

    setLoading(true);

    try {

      const res = await axios.post(
        `${API_URL}/query`,
        {
          question: finalQuestion,
        }
      );

      const aiMessage = {
        role: "assistant",
        content: res.data.answer,
        time: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMessage]);

    } catch {

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Backend connection error",
          time: new Date().toLocaleTimeString(),
        },
      ]);
    }

    setLoading(false);
  };

  const clearChat = () => {

    setMessages([]);

    localStorage.removeItem("chat_history");
  };

  const copyMessage = (text: string) => {

    navigator.clipboard.writeText(text);
  };

  const startVoiceInput = () => {

    const recognition =
      new window.webkitSpeechRecognition();

    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {

      setQuestion(
        event.results[0][0].transcript
      );
    };

    recognition.start();
  };

  return (

    <div
      className={`h-screen flex overflow-hidden relative ${
        darkMode
          ? "bg-[#0B1120] text-white"
          : "bg-gray-100 text-black"
      }`}
    >

      {/* BACKGROUND */}

      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 blur-[140px] rounded-full"></div>

      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/20 blur-[140px] rounded-full"></div>

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (

        <div
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />

      )}

      {/* SIDEBAR */}

      <div
        className={`fixed md:relative z-50 md:z-0 h-full w-80 transform transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        } ${
          darkMode
            ? "bg-[#111827]/80 border-zinc-800"
            : "bg-white border-gray-300"
        } border-r backdrop-blur-2xl flex flex-col`}
      >

        <div className="p-5 flex items-center justify-between border-b border-white/10">

          <button
            onClick={clearChat}
            className="flex items-center gap-3 bg-white text-black px-5 py-3 rounded-2xl font-semibold hover:scale-[1.02] transition-all"
          >

            <FaPlus />

            New Chat

          </button>

          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
            className="p-3 rounded-xl bg-white/10"
          >

            {darkMode
              ? <FaSun />
              : <FaMoon />}

          </button>

        </div>

        {/* HISTORY */}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          <h2 className="text-sm uppercase tracking-widest text-zinc-500 mb-4">
            Recent Chats
          </h2>

          {messages
            .filter((msg) => msg.role === "user")
            .slice()
            .reverse()
            .map((msg, index) => (

              <button
                key={index}
                onClick={() =>
                  setQuestion(msg.content)
                }
                className={`w-full text-left p-4 rounded-2xl transition-all hover:scale-[1.02] ${
                  darkMode
                    ? "bg-white/5 hover:bg-white/10 border border-white/10"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >

                <p className="truncate text-sm font-medium">
                  {msg.content}
                </p>

                <p className="text-xs text-zinc-400 mt-2">
                  {msg.time}
                </p>

              </button>

            ))}

        </div>

      </div>

      {/* MAIN */}

      <div className="flex-1 flex flex-col relative z-10">

        {/* HEADER */}

        <div className="border-b border-white/10 backdrop-blur-xl px-5 py-4 flex items-center gap-4">

          <button
            onClick={() =>
              setSidebarOpen(true)
            }
            className="md:hidden"
          >
            <FaBars />
          </button>

          <h1 className="text-2xl font-bold">
            Lumina AI
          </h1>

        </div>

        {/* CHAT */}

        <div className="flex-1 overflow-y-auto px-4 py-8">

          {messages.length === 0 && (

            <div className="h-full flex flex-col items-center justify-center">

              <div className="bg-white/10 border border-white/10 backdrop-blur-2xl p-8 rounded-full mb-8">

                <FaRobot size={60} />

              </div>

              <h1 className="text-6xl font-bold mb-4 text-center">
                Ask Anything
              </h1>

              <p className="text-zinc-400 text-xl mb-10">
                AI assistant for modern workflows
              </p>

              <div className="grid md:grid-cols-2 gap-4 max-w-3xl w-full">

                {[
                  "Build React dashboard UI",
                  "Generate FastAPI API",
                  "Explain LangChain",
                  "Optimize SQL query",
                ].map((item, i) => (

                  <button
                    key={i}
                    onClick={() =>
                      askAI(item)
                    }
                    className="bg-white/5 border border-white/10 backdrop-blur-xl p-5 rounded-2xl hover:scale-[1.02] hover:bg-white/10 transition-all text-left"
                  >
                    {item}
                  </button>

                ))}

              </div>

            </div>
          )}

          <div className="max-w-5xl mx-auto space-y-8">

            {messages.map((msg, index) => (

              <div
                key={index}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <div
                  className={`max-w-3xl rounded-3xl px-6 py-5 shadow-2xl ${
                    msg.role === "user"
                      ? "bg-blue-600"
                      : "bg-white/10 backdrop-blur-2xl border border-white/10"
                  }`}
                >

                  <div className="flex gap-4">

                    <div className="mt-1">

                      {msg.role === "user"
                        ? <FaUser />
                        : <FaRobot />}

                    </div>

                    <div className="flex-1">

                      <div className="prose prose-invert max-w-none">

                        <ReactMarkdown
                          components={{
                            code({
                              children,
                            }) {

                              return (
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language="javascript"
                                >
                                  {String(children)}
                                </SyntaxHighlighter>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>

                      </div>

                      <div className="flex items-center justify-between mt-4 text-xs text-zinc-400">

                        <span>{msg.time}</span>

                        {msg.role === "assistant" && (

                          <button
                            onClick={() =>
                              copyMessage(msg.content)
                            }
                            className="hover:text-white"
                          >
                            <FaCopy />
                          </button>

                        )}

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            ))}

            {loading && (

              <div className="flex justify-start">

                <div className="bg-white/10 backdrop-blur-xl border border-white/10 px-6 py-5 rounded-3xl">

                  <div className="flex gap-2">

                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>

                    <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></span>

                    <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></span>

                  </div>

                </div>

              </div>
            )}

            <div ref={messagesEndRef}></div>

          </div>

        </div>

        {/* INPUT */}

        <div className="p-6">

          <div className="max-w-5xl mx-auto rounded-[30px] bg-white/10 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center gap-4 px-5 py-4">

            <button
              onClick={startVoiceInput}
              className="text-zinc-400 hover:text-white"
            >
              <FaMicrophone />
            </button>

            <input
              type="text"
              value={question}
              onChange={(e) =>
                setQuestion(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" && askAI()
              }
              placeholder="Ask anything..."
              className="flex-1 bg-transparent outline-none text-lg"
            />

            <button
              onClick={() =>
                askAI()
              }
              className="bg-white text-black p-4 rounded-2xl hover:scale-110 transition-all"
            >
              <FaPaperPlane />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}