"use client";
import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import { API_URL } from "../../config";
import ReactMarkdown from "react-markdown";

interface ChatComponentProps {
  context: "general" | "visit"; // Define specific context types
  visitId?: number; // Optional for visit-specific context
}

interface Message {
  role: string;
  content: string;
}

export function ChatComponent({ context, visitId }: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  //const { t, i18n } = useTranslation()

  // Fetch suggested questions when component mounts

  useEffect(() => {
    const setUpChat = async () => {
      console.log("setUpChat");
      fetchQuestions();
      const contextString = await getContextString();
      console.log("contextString", contextString);
      setSystemPrompt(contextString);
    };

    setUpChat();
  }, []);

  const fetchQuestions = async () => {
    try {
      if (context === "general") {
        // Default questions for general context
        setSuggestedQuestions([
          "Can you summarize my recent visits?",
          "What vaccinations do I need?",
          "How can I access my medical records?",
          "What preventive screenings are recommended?",
        ]);
        return;
      }

      // Only make API call for visit-specific context
      const endpoint = `${API_URL}/generate-questions/${visitId}`;
      console.log("Fetching questions from:", endpoint);

      const response = await fetch(endpoint);
      const data = await response.json();

      console.log("Received questions:", data);

      if (data && Array.isArray(data)) {
        setSuggestedQuestions(data);
      } else {
        console.error("Invalid questions format:", data);
        setSuggestedQuestions([
          "What does my diagnosis mean?",
          "How should I take my medications?",
          "When should I schedule follow-up?",
          "What symptoms need immediate attention?",
        ]);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setSuggestedQuestions([
        "What does my diagnosis mean?",
        "How should I take my medications?",
        "When should I schedule follow-up?",
        "What symptoms need immediate attention?",
      ]);
    }
  };

  const getContextString = async () => {
    console.log("context", context);
    console.log("visitId", visitId);
    if (context === "visit" && visitId) {
      const response = await fetch(API_URL + `/chat-context/${visitId}`);
      const data = await response.json();
      return data.raw_text;
    }
    return `General medical chat about all your visits and medical history`;
  };

  const setSystemPrompt = (context: string) => {
    console.log("messages before pushing system prompt", messages);
    setMessages([
      {
        // First, update the system prompt
        role: "system",
        content: `You are a knowledgeable and compassionate medical assistant helping patients understand their health information.

                  Your key responsibilities:
                  1. Provide clear, concise explanations of medical information
                  2. Match the user's communication style and desired level of detail
                  3. Use friendly, reassuring language while maintaining professionalism
                  4. Include relevant citations as numbered markdown links
                  
                  Context about the patient: ${context}

                  Response format:
                  - Start with brief, clear answers
                  - Provide more detailed explanations only if asked
                  - Match the user's language complexity level
                  - When citing in text, use [n] format
                  - When listing sources, use this format:
                    Sources:
                    1. [Source Title](URL)
                    2. [Source Title](URL)

                  Example:
                  Eat plenty of vegetables [1] and whole grains [2].

                  Sources:
                  1. [Harvard Health - Nutrition Guide](https://health.harvard.edu/...)
                  2. [NIH Dietary Guidelines](https://www.nih.gov/...)
                  `,
      },
    ]);
    console.log("messages after pushing system prompt", messages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    console.log("message update?", messages);

    const userMessage = {
      role: "user",
      content: input,
    };

    // Create the new messages array
    const updatedMessages = [...messages, userMessage];

    // Update state
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(API_URL + "/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Use the updatedMessages array instead of messages
        body: JSON.stringify(updatedMessages),
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: aiResponse,
        },
      ]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex flex-col h-full p-4">
        {/* Suggested Questions - Show for both contexts */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Suggested Questions</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                className="bg-purple-100 hover:bg-purple-200 px-3 py-1 rounded-full text-sm"
                onClick={() => setInput(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-grow overflow-y-auto mb-4 space-y-4">
          {messages
            .filter((message) => message.role !== "system")
            .map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      // Existing components...
                      p: ({ children }) => <p className="mb-2">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="list-disc ml-4 mb-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal ml-4 mb-2">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="mb-1">{children}</li>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-xl font-bold mb-2">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-lg font-bold mb-2">{children}</h2>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">{children}</em>
                      ),
                      // Add link handling
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 underline"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <span className="animate-pulse">{"typing"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-grow"
          />
          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
