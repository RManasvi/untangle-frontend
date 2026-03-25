import { Card } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import BotAvatar from '@/components/BotAvatar';

export default function ChatMessage({ message }) {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <Card
        className={`max-w-xs lg:max-w-md px-4 py-3 border shadow-sm ${
          isBot
            ? 'bg-secondary border-border text-foreground'
            : 'bg-primary border-primary text-primary-foreground'
        }`}
      >
        <div className="flex items-start gap-3">
          {isBot && (
            <div className="mt-0.5 flex-shrink-0">
              <BotAvatar className="w-8 h-8 shadow-sm border border-border" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isBot && message.emotion && (
                <div
                  className={`${
                    message.emotion === 'happy'
                      ? 'text-green-500'
                      : message.emotion === 'sad'
                      ? 'text-blue-500'
                      : message.emotion === 'anxious'
                      ? 'text-yellow-500'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Heart className="h-3.5 w-3.5 fill-current" />
                </div>
              )}
            </div>
            <p className="text-sm leading-relaxed">{message.text}</p>
            <p className={`text-[10px] mt-1.5 opacity-70 ${isBot ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
