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
    SpeechRecognition: any;
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

    const saved = localStorage.getItem("chat_history");

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

    const userMessage: Message = {
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

      const aiMessage: Message = {
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

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {

      setQuestion(
        event.results[0][0].transcript
      );
    };

    recognition.start();
  };

  return (

    <div className={`h-screen flex overflow-hidden ${
      darkMode
        ? "bg-[#0B1120] text-white"
        : "bg-gray-100 text-black"
    }`}>

      {/* SIDEBAR */}

      <div className={`${
        sidebarOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
      } fixed md:relative z-50 h-full w-80 transition-transform duration-300 border-r border-white/10 bg-[#111827]/80 backdrop-blur-2xl flex flex-col`}>

        <div className="p-5 flex items-center justify-between border-b border-white/10">

          <button
            onClick={clearChat}
            className="flex items-center gap-3 bg-white text-black px-5 py-3 rounded-2xl font-semibold"
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
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>

        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">

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
                className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition"
              >

                <p className="truncate text-sm">
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

      <div className="flex-1 flex flex-col">

        {/* HEADER */}

        <div className="border-b border-white/10 px-5 py-4 flex items-center gap-4">

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

          <div className="max-w-5xl mx-auto space-y-8">

            {messages.length === 0 && (

              <div className="text-center mt-32">

                <FaRobot
                  size={60}
                  className="mx-auto mb-6"
                />

                <h1 className="text-6xl font-bold mb-4">
                  Ask Anything
                </h1>

                <p className="text-zinc-400">
                  Your AI assistant is ready
                </p>

              </div>
            )}

            {messages.map((msg, index) => (

              <div
                key={index}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <div className={`max-w-3xl rounded-3xl px-6 py-5 ${
                  msg.role === "user"
                    ? "bg-blue-600"
                    : "bg-white/10 border border-white/10"
                }`}>

                  <div className="flex gap-4">

                    <div className="mt-1">

                      {msg.role === "user"
                        ? <FaUser />
                        : <FaRobot />}

                    </div>

                    <div className="flex-1">

                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>

                      <div className="flex items-center justify-between mt-4 text-xs text-zinc-400">

                        <span>{msg.time}</span>

                        {msg.role === "assistant" && (

                          <button
                            onClick={() =>
                              copyMessage(msg.content)
                            }
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

              <div className="text-zinc-400">
                Thinking...
              </div>

            )}

            <div ref={messagesEndRef}></div>

          </div>

        </div>

        {/* INPUT */}

        <div className="p-6">

          <div className="max-w-5xl mx-auto rounded-[30px] bg-white/10 border border-white/10 flex items-center gap-4 px-5 py-4">

            <button
              onClick={startVoiceInput}
              className="text-zinc-400"
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
              className="bg-white text-black p-4 rounded-2xl"
            >
              <FaPaperPlane />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}