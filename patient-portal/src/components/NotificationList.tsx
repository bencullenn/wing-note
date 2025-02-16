"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { ChatComponent } from "./ChatComponent";

const notifications = [
  {
    id: 1,
    type: "prescription",
    message:
      "Dr. Ho has prescribed 'Niki' for birth control. Your prescription will be ready for pickup on June 20, 2025, at Francis Pharmacy.",
    time: "2 hr",
    color: "bg-amber-50 border-amber-200",
    suggestedQuestions: [
      "What are the common side effects?",
      "How should I take this medication?",
      "Are there any dietary restrictions?",
      "When should I schedule a follow-up?",
    ],
  },
  {
    id: 2,
    type: "recommendation",
    message:
      "Dr. Chen recommends a low-FODMAP diet to help manage high blood sugar symptoms",
    time: "1 week",
    color: "bg-green-50 border-green-200",
    suggestedQuestions: [
      "What foods should I avoid?",
      "How long should I follow this diet?",
      "What are FODMAP foods?",
      "Can you suggest some meal plans?",
    ],
  },
];

export default function NotificationList() {
  const [visibleNotifications, setVisibleNotifications] =
    useState(notifications);
  const [selectedNotification, setSelectedNotification] = useState<
    null | (typeof notifications)[0]
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDismiss = (id: number) => {
    setVisibleNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const handleExplain = (notification: (typeof notifications)[0]) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {visibleNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`${notification.color} border`}
          >
            <div className="p-4 relative">
              <button
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                onClick={() => handleDismiss(notification.id)}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="pr-6">
                <p className="text-gray-700 mb-3">{notification.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {notification.time}
                  </span>
                  <Button
                    variant="ghost"
                    className="text-purple-600 p-0 h-auto hover:text-purple-700"
                    onClick={() => handleExplain(notification)}
                  >
                    Explain to me <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Questions & Answers</DialogTitle>
          </DialogHeader>
          <div className="flex-grow flex flex-col overflow-hidden">
            <div className="mb-4 grid grid-cols-2 gap-2">
              {selectedNotification?.suggestedQuestions.map(
                (question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left h-auto whitespace-normal p-3"
                    onClick={() => {
                      // Here you would typically send this question to the chat
                      console.log("Selected question:", question);
                    }}
                  >
                    {question}
                  </Button>
                )
              )}
            </div>
            <div className="flex-grow overflow-hidden">
              {/*<ChatComponent
                context={`notification-${selectedNotification?.id}`}
                initialMessage={selectedNotification?.message}
              />*/}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
