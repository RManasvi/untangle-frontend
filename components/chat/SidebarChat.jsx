'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Lightbulb, Brain, Wind, TrendingUp, X, BookOpen, Award } from 'lucide-react';

export default function SidebarChat({ open, onClose, onAddToChat }) {
  const [activeTab, setActiveTab] = useState('learning');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const gestureCorrections = [
    {
      title: 'Better Posture',
      desc: 'Sit up straight and relax your shoulders',
      tips: [
        'Keep your spine aligned naturally',
        'Relax your shoulders away from ears',
        'Take breaks every 30 minutes',
      ],
    },
    {
      title: 'Breathing Technique',
      desc: 'Deep breathing: 4-7-8 technique',
      tips: [
        'Inhale for 4 counts through nose',
        'Hold for 7 counts',
        'Exhale for 8 counts through mouth',
      ],
    },
    {
      title: 'Hand Placement',
      desc: 'Keep hands relaxed on your lap',
      tips: [
        'Rest hands gently on your thighs',
        'Keep fingers unclenched',
        'Let shoulders stay relaxed',
      ],
    },
  ];

  const learningTopics = [
    {
      title: 'Stress Management',
      icon: <Brain className="h-5 w-5" />,
      lessons: [
        'Understanding stress triggers',
        'Progressive muscle relaxation',
        'Building resilience through practice',
      ],
    },
    {
      title: 'Mindfulness',
      icon: <Wind className="h-5 w-5" />,
      lessons: [
        'Mindful breathing exercises',
        'Body awareness meditation',
        'Present moment focus techniques',
      ],
    },
    {
      title: 'Emotional Awareness',
      icon: <TrendingUp className="h-5 w-5" />,
      lessons: [
        'Identifying your emotions',
        'Understanding emotional triggers',
        'Healthy emotional responses',
      ],
    },
    {
      title: 'Sleep Hygiene',
      icon: <Wind className="h-5 w-5" />,
      lessons: [
        'Establishing sleep schedules',
        'Creating calm sleep environment',
        'Evening relaxation routines',
      ],
    },
    {
      title: 'Anxiety Relief',
      icon: <Lightbulb className="h-5 w-5" />,
      lessons: [
        'Grounding techniques (5-4-3-2-1)',
        'Box breathing methods',
        'Emergency stress relief tips',
      ],
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 bg-white border-blue-100">
        <SheetHeader>
          <SheetTitle className="text-slate-900 flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Wellness Hub
          </SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 border-b border-blue-100">
          <Button
            variant={activeTab === 'learning' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setActiveTab('learning');
              setSelectedTopic(null);
            }}
            className={`flex-1 rounded-none border-b-2 ${
              activeTab === 'learning'
                ? 'border-blue-600 bg-transparent text-blue-600'
                : 'border-transparent text-slate-600 hover:text-blue-600'
            }`}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Learning
          </Button>
          <Button
            variant={activeTab === 'tips' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setActiveTab('tips');
              setSelectedTopic(null);
            }}
            className={`flex-1 rounded-none border-b-2 ${
              activeTab === 'tips'
                ? 'border-blue-600 bg-transparent text-blue-600'
                : 'border-transparent text-slate-600 hover:text-blue-600'
            }`}
          >
            <Award className="h-4 w-4 mr-2" />
            Tips
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)] mt-4">
          <div className="pr-4">
            {/* Learning Bot Tab */}
            {activeTab === 'learning' && (
              <>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  Explore Topics
                </h3>
                {selectedTopic ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        setSelectedTopic(null);
                        setSelectedLesson(null);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-blue-200 text-slate-700"
                    >
                      ← Back to Topics
                    </Button>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                        {selectedTopic.title}
                      </h4>
                      <div className="space-y-2">
                        {selectedTopic.lessons.map((lesson, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedLesson(lesson);
                              if (onAddToChat) {
                                onAddToChat(`Tell me more about: ${lesson}`);
                              }
                            }}
                            className="w-full text-left p-3 bg-white rounded border border-blue-100 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                          >
                            <p className="text-xs text-slate-700 font-medium group-hover:text-blue-700">
                              {lesson}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 group-hover:text-blue-600">
                              Click to learn more →
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {learningTopics.map((topic, idx) => (
                      <Button
                        key={idx}
                        onClick={() => setSelectedTopic(topic)}
                        variant="outline"
                        className="w-full justify-start border-blue-200 text-slate-700 hover:bg-blue-50 h-auto py-3"
                      >
                        <span className="text-blue-600 mr-3">{topic.icon}</span>
                        <span className="text-left">{topic.title}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Gesture Corrections Tab */}
            {activeTab === 'tips' && (
              <>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  Posture & Gesture Tips
                </h3>
                <div className="space-y-3">
                  {gestureCorrections.map((correction, idx) => (
                    <Card
                      key={idx}
                      className="border-blue-100 bg-blue-50 p-4 cursor-pointer hover:bg-blue-100 transition-colors duration-200 hover:shadow-md"
                      onClick={() => {
                        if (onAddToChat) {
                          onAddToChat(`Can you help me with ${correction.title}? ${correction.desc}`);
                        }
                      }}
                    >
                      <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2 group">
                        <Wind className="h-4 w-4 text-blue-600" />
                        {correction.title}
                        <span className="ml-auto text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Ask me
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 mb-3">{correction.desc}</p>
                      <div className="space-y-1">
                        {correction.tips.map((tip, tipIdx) => (
                          <div key={tipIdx} className="flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                            <p className="text-xs text-slate-600">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
