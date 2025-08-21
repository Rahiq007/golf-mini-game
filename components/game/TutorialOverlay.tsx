"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TutorialOverlayProps {
  isOpen: boolean
  onClose: () => void
  onSkip: () => void
  className?: string
}

const tutorialSteps = [
  {
    title: "Welcome to Golf Mini-Game!",
    content: "Win amazing coupons with just one perfect shot. Let's learn how to play!",
    icon: "🏌️",
  },
  {
    title: "Choose Your Prizes",
    content: "First, select exactly 5 coupons from our collection. These will be your potential prizes!",
    icon: "🎁",
  },
  {
    title: "Aim Your Shot",
    content:
      "Use drag controls or sliders to set your angle and power. Watch the trajectory preview to plan your shot.",
    icon: "🎯",
  },
  {
    title: "Take the Shot",
    content: "Click 'Take Shot' to launch the ball. The physics simulation will determine if you hit the hole!",
    icon: "⛳",
  },
  {
    title: "Win Your Prize",
    content: "Land the ball in the hole to win one of your selected coupons. Good luck!",
    icon: "🏆",
  },
]

export default function TutorialOverlay({ isOpen, onClose, onSkip, className = "" }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentTutorial = tutorialSteps[currentStep]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={`w-full max-w-md ${className}`}
          >
            <Card className="p-8">
              <div className="text-center space-y-6">
                {/* Step indicator */}
                <div className="flex justify-center space-x-2 mb-4">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep ? "bg-blue-600" : index < currentStep ? "bg-green-600" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {/* Tutorial content */}
                <motion.div
                  key={currentStep}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-6xl">{currentTutorial.icon}</div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentTutorial.title}</h2>
                  <p className="text-gray-600 leading-relaxed">{currentTutorial.content}</p>
                </motion.div>

                {/* Navigation buttons */}
                <div className="flex justify-between items-center pt-4">
                  <Button onClick={onSkip} variant="ghost" size="sm" className="text-gray-500">
                    Skip Tutorial
                  </Button>

                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button onClick={handlePrevious} variant="outline" size="sm">
                        Previous
                      </Button>
                    )}
                    <Button onClick={handleNext} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      {currentStep === tutorialSteps.length - 1 ? "Start Playing!" : "Next"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
