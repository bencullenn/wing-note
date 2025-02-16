"use client"
import React from 'react'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send } from "lucide-react"
import { API_URL, PATIENT_MRN } from "../../config";

interface ChatComponentProps {
  context: 'general' | 'visit';  // Define specific context types
  visitId?: number;  // Optional for visit-specific context
}

interface Message {
  role: string
  content: string
}

export function ChatComponent({ context, visitId }: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  //const { t, i18n } = useTranslation()

  // Fetch suggested questions when component mounts
  const setUpChat = async () => {
    console.log("setUpChat")
    fetchQuestions();
    const contextString = await getContextString();
    setSystemPrompt(contextString);
  }
  
  useEffect(() => {
    setUpChat();
  }, [])

  const updateMessages = (messages: Message[]) => {
    setMessages(messages);
  }

  const fetchQuestions = async () => {
    try {
      const response = await fetch(API_URL + `/generate-questions`);
      const data = await response.json()
      setSuggestedQuestions(data.questions)
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const getContextString = async () => {
    if (context === 'general') {
      return `General medical chat about all your visits and medical history`;
    } else if (context === 'visit' && visitId) {
      const response = await fetch(API_URL + `/chat-context/${visitId}`);
      const data = await response.json();
      return data.context;
    }
    return '';
  };

  const setSystemPrompt = (context: string) => {
    console.log("messages before pushing system prompt", messages)
    setMessages([{
      "role": "system",
      "content": `You are a knowledgeable and compassionate medical assistant helping patients understand their health information.

                  Your key responsibilities:
                  1. Explain medical terms and concepts at the appropriate level of complexity for each patient
                  2. Break down medical information based on the patient's needs and preferences
                  3. Provide clear context for lab results, diagnoses, and treatments
                  4. Use friendly, reassuring language while maintaining professionalism
                  5. Give practical examples when helpful
                  6. Acknowledge and address concerns or worries
                  7. Empower patients with knowledge to better manage their health

                  Context about the patient: ${context}

                  Remember to:
                  - Adapt your language and complexity level based on the patient's question and needs
                  - If they want simple explanations, use plain language
                  - If they want technical details, provide more complex medical information
                  - If they want brief answers, be concise
                  - If they want in-depth explanations, be comprehensive
                  - Always maintain professionalism while being flexible with your communication style
                  - Gauge the appropriate level of detail from their question
                  - Express empathy and understanding
                  `
    
              }]);
    console.log("messages after pushing system prompt", messages)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
  
    const userMessage = { 
      role: 'user', 
      content: input, 
    };
  
    // Create the new messages array
    const updatedMessages = [...messages, userMessage];
    
    // Update state
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
  
    try {
      const response = await fetch(API_URL + '/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Use the updatedMessages array instead of messages
        body: JSON.stringify(updatedMessages)
      });
  
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      setMessages([...updatedMessages, { 
        role: 'assistant', 
        content: aiResponse,
      }]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsLoading(false);
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex flex-col h-full p-4">
        {/* Suggested Questions */}
        {visitId && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">{('suggested_questions')}</h3>
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
        )}

        {/* Chat Messages */}
        <div className="flex-grow overflow-y-auto mb-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-purple-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <span className="animate-pulse">{('typing')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={('ask_question')}
            className="flex-grow"
          />
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}