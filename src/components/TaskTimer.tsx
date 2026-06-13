import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, AlertTriangle } from "lucide-react";
import { Task } from "../types";
import { playAlertChime } from "../utils/sound";

interface TaskTimerProps {
  task: Task;
  onUpdateTimer: (taskId: string, remaining: number, isRunning: boolean) => void;
  canControl: boolean;
}

export default function TaskTimer({ task, onUpdateTimer, canControl }: TaskTimerProps) {
  const [remaining, setRemaining] = useState<number>(task.timerRemaining);
  const [isRunning, setIsRunning] = useState<boolean>(task.timerIsRunning);
  const [isAlerting, setIsAlerting] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if task props change from upstream
  useEffect(() => {
    setRemaining(task.timerRemaining);
    setIsRunning(task.timerIsRunning);
  }, [task.timerRemaining, task.timerIsRunning]);

  // Handle countdown interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsAlerting(true);
            playAlertChime();
            onUpdateTimer(task.id, 0, false);
            return 0;
          }
          const nextVal = prev - 1;
          // Periodically sync every 15 seconds to db to minimize writes, and sync upon action
          if (nextVal % 15 === 0) {
            onUpdateTimer(task.id, nextVal, true);
          }
          return nextVal;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, task.id]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canControl) return;
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    onUpdateTimer(task.id, remaining, nextRunning);
  };

  const resetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canControl) return;
    setIsRunning(false);
    setIsAlerting(false);
    setRemaining(task.timerDuration);
    onUpdateTimer(task.id, task.timerDuration, false);
  };

  const dismissAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAlerting(false);
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0")
    ].join(":");
  };

  const percentLeft = (remaining / Math.max(task.timerDuration, 1)) * 100;

  return (
    <div id={`timer-${task.id}`} className="mt-2 p-2.5 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-wide text-indigo-900/60 font-sans">
          الوقت المخصص للمهمة
        </span>
        <span className="text-xs font-mono font-bold text-slate-800">
          {formatTime(remaining)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-200/50 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 rounded-full ${
            remaining < 60 ? "bg-red-500 animate-pulse" : remaining < 300 ? "bg-orange-400" : "bg-gradient-to-r from-blue-500 to-indigo-500"
          }`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-1 gap-2">
        {/* Play control buttons */}
        {canControl ? (
          <div className="flex gap-1">
            <button
              onClick={togglePlayPause}
              disabled={remaining === 0}
              id={`timer-toggle-${task.id}`}
              className="p-1 px-2.5 rounded-lg border border-white/40 bg-white/60 hover:bg-white/80 active:scale-95 transition-all text-xs font-medium text-slate-800 flex items-center gap-1 disabled:opacity-40"
              title={isRunning ? "إيقاف مؤقت" : "تشغيل المؤقت"}
            >
              {isRunning ? <Pause className="w-3 h-3 text-red-500" /> : <Play className="w-3 h-3 text-emerald-600" />}
              <span className="text-[10px]">{isRunning ? "مؤقت" : "بدء"}</span>
            </button>
            <button
              onClick={resetTimer}
              id={`timer-reset-${task.id}`}
              className="p-1 px-1.5 rounded-lg border border-white/40 bg-white/40 hover:bg-white/60 active:scale-95 transition-all text-slate-700"
              title="إعادة ضبط المؤقت"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 italic block">المؤقت مدار من جانب الموظف</div>
        )}

        {/* Task Weight Badge */}
        <span id={`weight-badge-${task.id}`} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 font-semibold border border-indigo-500/20">
          الوزن: {task.weight} نقطة
        </span>
      </div>

      {/* Alarm ringing banner */}
      {isAlerting && (
        <div id={`timer-alert-${task.id}`} className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-800 text-[11px] font-medium flex items-center justify-between animate-bounce">
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>انتهى الوقت المحدد للمهمة!</span>
          </span>
          <button 
            onClick={dismissAlert}
            id={`timer-dismiss-${task.id}`}
            className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold"
          >
            كتم
          </button>
        </div>
      )}
    </div>
  );
}
