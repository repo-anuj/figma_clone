import { useBroadcastEvent, useEventListener, useMyPresence, useOthers } from '@/liveblocks.config'
import LiveCursors from './cursor/LiveCursors'
import React, { useCallback, useEffect } from 'react';
import CursorChat from './cursor/CursorChat';
import { CursorMode, CursorState, Reaction, ReactionEvent } from '@/types/type';
import { useState } from 'react';
import ReactionSelector from './reaction/ReactionButton';
import FlyingReaction from './reaction/FlyingReaction';
import useInterval from '@/hooks/useInterval';

type Props = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

const Live = ({ canvasRef }: Props) => {
  const others = useOthers();
  const [{ cursor }, updateMyPresence] = useMyPresence() as any;

  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  });

  const [reactions, setReactions] = useState<Reaction[]>([]);

  const broadcast = useBroadcastEvent();

  useInterval(() => {
    setReactions((reactions) => reactions.filter((reaction) => reaction.timestamp > Date.now() - 4000));
  }, 1000);

  useInterval(() => {
    if (cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor) {
      // concat all the reactions created on mouse click
      setReactions((reactions) =>
        reactions.concat([
          {
            point: { x: cursor.x, y: cursor.y },
            value: cursorState.reaction,
            timestamp: Date.now(),
          },
        ])
      );

      // Broadcast the reaction to other users
      broadcast({
        x: cursor.x,
        y: cursor.y,
        value: cursorState.reaction,
      });
    }
  }, 100);

  useEventListener((eventData) => {
    const event = eventData.event as ReactionEvent;
    setReactions((reactions) =>
      reactions.concat([
        {
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now(),
        },
      ])
    );
  });

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();

    if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {

      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });
    }
  }, [])

  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    setCursorState({
      mode: CursorMode.Hidden,
    })
    updateMyPresence({ cursor: null, message: null });
  }, [])

  const handlePointerDown = useCallback((event: React.PointerEvent) => {

    const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
    const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

    updateMyPresence({ cursor: { x, y } });

    setCursorState((state: CursorState) =>
      cursorState.mode === CursorMode.Reaction ? { ...state, isPressed: true } : state
    );

  }, [cursorState.mode, setCursorState])

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    setCursorState((state: CursorState) =>
      cursorState.mode === CursorMode.Reaction ? { ...state, isPressed: true } : state);
  }, [cursorState.mode, setCursorState])

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === '/') {
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: '',
        })
      } else if (e.key === 'Escape') {
        updateMyPresence({ message: '' })
        setCursorState({
          mode: CursorMode.Hidden,
        })
      } else if (e.key === "e") {
        setCursorState({ mode: CursorMode.ReactionSelector });
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        e.preventDefault();
      }
    }

    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyDown);
    }

  }, [updateMyPresence]);

  const handleSetReactions = useCallback((reaction: string) => { // Renamed to handleSetReactions
    setCursorState({
      mode: CursorMode.Reaction,
      reaction,
      isPressed: false,
    });
  }, []);

  return (
    <div
      id="canvas"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="h-[100vh] w-full flex justify-center items-center text-center"
    >
      <canvas  ref={canvasRef}/>

       {/* Render the reactions */}
       {reactions.map((reaction) => (
          <FlyingReaction
            key={reaction.timestamp.toString()}
            x={reaction.point.x}
            y={reaction.point.y}
            timestamp={reaction.timestamp}
            value={reaction.value}
          />
        ))}

      {cursor && (
        <CursorChat
          cursor={cursor}
          cursorState={cursorState}
          setCursorState={setCursorState}
          updateMyPresence={updateMyPresence}
        />
      )}

      {cursorState.mode === CursorMode.ReactionSelector && (
        <ReactionSelector setReaction={handleSetReactions} /> // Use handleSetReactions here
      )}

      <LiveCursors others={others} />
    </div>
  )
}

export default Live