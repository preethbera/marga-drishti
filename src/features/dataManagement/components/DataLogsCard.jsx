import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { useUiStore } from '@core/store/useUiStore';
import { ScrollArea } from '@components/ui/scroll-area';
import { Terminal } from 'lucide-react';

export default function DataLogsCard() {
  const { logs } = useUiStore();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Terminal className="w-5 h-5 text-muted-foreground" />
          System Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 relative">
        <div className="absolute inset-4 rounded-md bg-muted/50 border overflow-auto p-4 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-muted-foreground italic">No logs yet...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-1">
                <span className="text-muted-foreground opacity-70">[{log.time}]</span>{' '}
                <span className="text-foreground">{log.message}</span>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
      </CardContent>
    </Card>
  );
}
