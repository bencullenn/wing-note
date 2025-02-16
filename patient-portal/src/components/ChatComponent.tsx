"use client";
import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Mic, MicOff, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ChatComponentProps {
  context: string;
  initialMessage?: string;
}

export function ChatComponent({ context, initialMessage }: ChatComponentProps) {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const { messages, input, handleInputChange, handleSubmit, setInput } =
    useChat({
      api: "/api/chat",
      initialMessages: [
        {
          id: "1",
          role: "system",
          content: `You are a helpful assistant for a patient app. The current context is: ${context}. ${
            initialMessage ? `The user is asking about: ${initialMessage}` : ""
          }`,
        },
      ],
    });

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (isListening) {
      //recognitionRef.current?.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      //recognitionRef.current?.stop();
    } else {
      //recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleVoiceSubmit = () => {
    if (input.trim()) {
      handleSubmit(new Event("submit") as any);
      //recognitionRef.current?.stop();
    }
  };

  useEffect(() => {
    if (isVoiceMode && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(lastMessage.content);
        utterance.onend = () => setIsSpeaking(false);
        synthRef.current?.speak(utterance);
      }
    }
  }, [isVoiceMode, messages]);

  return (
    <Card
      className={cn(
        "flex flex-col h-full transition-all duration-300",
        isVoiceMode && "bg-gray-950 border-gray-800"
      )}
    >
      <CardContent className="flex flex-col h-full p-4 relative">
        {isVoiceMode && (
          <button
            onClick={() => setIsVoiceMode(false)}
            className="absolute top-4 left-4 text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {!isVoiceMode && (
          <div className="flex justify-end items-center mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={isVoiceMode}
                onCheckedChange={toggleVoiceMode}
                id="voice-mode"
              />
              <label htmlFor="voice-mode" className="text-sm">
                Voice Mode
              </label>
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex-grow overflow-y-auto mb-4 space-y-4",
            isVoiceMode && "text-white"
          )}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  message.role === "user"
                    ? "bg-purple-600 text-white rounded-br-none"
                    : isVoiceMode
                    ? "bg-gray-800 text-white rounded-bl-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isListening && (
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>

        <div className={cn("relative", isVoiceMode && "flex justify-center")}>
          {isVoiceMode ? (
            <Button
              size="lg"
              onClick={toggleListening}
              className={cn(
                "rounded-full w-16 h-16 p-0",
                isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-purple-600 hover:bg-purple-700"
              )}
            >
              {isListening ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-grow"
              />
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
