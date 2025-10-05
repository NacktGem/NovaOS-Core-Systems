import { useRef, useCallback, useEffect, useState } from 'react';
import './TouchInteractions.css';

export interface TouchPoint {
  identifier: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

export interface PinchGesture {
  scale: number;
  center: { x: number; y: number };
  velocity: number;
}

export interface TouchInteractionProps {
  children: React.ReactNode;
  className?: string;

  // Swipe detection
  onSwipe?: (_gesture: SwipeGesture) => void;
  swipeThreshold?: number;
  swipeVelocityThreshold?: number;

  // Pinch/zoom detection
  onPinch?: (_gesture: PinchGesture) => void;
  pinchThreshold?: number;

  // Long press detection
  onLongPress?: (_point: TouchPoint) => void;
  longPressDelay?: number;

  // Tap detection
  onTap?: (_point: TouchPoint) => void;
  onDoubleTap?: (_point: TouchPoint) => void;
  doubleTapDelay?: number;

  // Pan detection
  onPanStart?: (_point: TouchPoint) => void;
  onPanMove?: (_point: TouchPoint, _delta: { x: number; y: number }) => void;
  onPanEnd?: (_point: TouchPoint) => void;

  // Configuration
  preventDefaultTouch?: boolean;
  preventScroll?: boolean;
  disabled?: boolean;
}

export const TouchInteractionArea: React.FC<TouchInteractionProps> = ({
  children,
  className = '',
  onSwipe,
  swipeThreshold = 50,
  swipeVelocityThreshold = 0.3,
  onPinch,
  pinchThreshold = 0.1,
  onLongPress,
  longPressDelay = 800,
  onTap,
  onDoubleTap,
  doubleTapDelay = 300,
  onPanStart,
  onPanMove,
  onPanEnd,
  preventDefaultTouch = false,
  preventScroll = false,
  disabled = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef({
    touches: new Map<number, TouchPoint>(),
    startTime: 0,
    lastTap: 0,
    tapCount: 0,
    longPressTimer: null as NodeJS.Timeout | null,
    initialPinchDistance: 0,
    isPanning: false,
    panStart: null as TouchPoint | null
  });

  // Helper function to extract touch point
  const getTouchPoint = useCallback((touch: Touch): TouchPoint => ({
    identifier: touch.identifier,
    clientX: touch.clientX,
    clientY: touch.clientY,
    pageX: touch.pageX,
    pageY: touch.pageY
  }), []);

  // Calculate distance between two points
  const calculateDistance = useCallback((point1: TouchPoint, point2: TouchPoint): number => {
    const dx = point1.clientX - point2.clientX;
    const dy = point1.clientY - point2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate center point between two touches
  const calculateCenter = useCallback((point1: TouchPoint, point2: TouchPoint) => ({
    x: (point1.clientX + point2.clientX) / 2,
    y: (point1.clientY + point2.clientY) / 2
  }), []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    if (preventDefaultTouch) {
      e.preventDefault();
    }

    const touches = Array.from(e.touches).map(getTouchPoint);
    const touchState = touchStateRef.current;

    // Store current touches
    touchState.touches.clear();
    touches.forEach(touch => {
      touchState.touches.set(touch.identifier, touch);
    });

    touchState.startTime = Date.now();

    if (touches.length === 1) {
      const touch = touches[0];

      // Handle tap detection
      const currentTime = Date.now();
      if (onDoubleTap && currentTime - touchState.lastTap < doubleTapDelay) {
        touchState.tapCount++;
        if (touchState.tapCount === 2) {
          onDoubleTap(touch);
          touchState.tapCount = 0;
          touchState.lastTap = 0;
        }
      } else {
        touchState.tapCount = 1;
        touchState.lastTap = currentTime;
      }

      // Start long press timer
      if (onLongPress) {
        touchState.longPressTimer = setTimeout(() => {
          if (touchState.touches.has(touch.identifier)) {
            onLongPress(touch);
          }
        }, longPressDelay);
      }

      // Handle pan start
      if (onPanStart || onPanMove || onPanEnd) {
        touchState.isPanning = true;
        touchState.panStart = touch;
        onPanStart?.(touch);
      }

    } else if (touches.length === 2) {
      // Handle pinch start
      if (onPinch) {
        touchState.initialPinchDistance = calculateDistance(touches[0], touches[1]);
      }

      // Clear long press timer for multi-touch
      if (touchState.longPressTimer) {
        clearTimeout(touchState.longPressTimer);
        touchState.longPressTimer = null;
      }
    }
  }, [
    disabled,
    preventDefaultTouch,
    getTouchPoint,
    onDoubleTap,
    doubleTapDelay,
    onLongPress,
    longPressDelay,
    onPanStart,
    onPanMove,
    onPanEnd,
    onPinch,
    calculateDistance
  ]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    if (preventScroll || preventDefaultTouch) {
      e.preventDefault();
    }

    const touches = Array.from(e.touches).map(getTouchPoint);
    const touchState = touchStateRef.current;

    if (touches.length === 1 && touchState.isPanning && onPanMove && touchState.panStart) {
      const touch = touches[0];
      const delta = {
        x: touch.clientX - touchState.panStart.clientX,
        y: touch.clientY - touchState.panStart.clientY
      };
      onPanMove(touch, delta);

    } else if (touches.length === 2 && onPinch && touchState.initialPinchDistance > 0) {
      const currentDistance = calculateDistance(touches[0], touches[1]);
      const scale = currentDistance / touchState.initialPinchDistance;

      if (Math.abs(scale - 1) > pinchThreshold) {
        const center = calculateCenter(touches[0], touches[1]);
        const velocity = (scale - 1) / ((Date.now() - touchState.startTime) / 1000);

        onPinch({
          scale,
          center,
          velocity
        });
      }
    }

    // Clear long press timer on movement
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
      touchState.longPressTimer = null;
    }
  }, [
    disabled,
    preventScroll,
    preventDefaultTouch,
    getTouchPoint,
    onPanMove,
    onPinch,
    calculateDistance,
    calculateCenter,
    pinchThreshold
  ]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    if (preventDefaultTouch) {
      e.preventDefault();
    }

    const _touches = Array.from(e.touches).map(getTouchPoint);
    const changedTouches = Array.from(e.changedTouches).map(getTouchPoint);
    const touchState = touchStateRef.current;

    // Clear long press timer
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
      touchState.longPressTimer = null;
    }

    // Handle swipe detection
    if (onSwipe && changedTouches.length === 1 && touchState.touches.size === 1) {
      const endTouch = changedTouches[0];
      const startTouch = touchState.touches.get(endTouch.identifier);

      if (startTouch) {
        const deltaX = endTouch.clientX - startTouch.clientX;
        const deltaY = endTouch.clientY - startTouch.clientY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = Date.now() - touchState.startTime;
        const velocity = distance / duration;

        if (distance > swipeThreshold && velocity > swipeVelocityThreshold) {
          let direction: SwipeGesture['direction'];

          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
          } else {
            direction = deltaY > 0 ? 'down' : 'up';
          }

          onSwipe({
            direction,
            distance,
            velocity,
            duration
          });
        }
      }
    }

    // Handle tap detection
    if (onTap && changedTouches.length === 1 && touchState.tapCount === 1) {
      const touch = changedTouches[0];
      const duration = Date.now() - touchState.startTime;

      // Only trigger tap if it was a quick touch without much movement
      if (duration < 300) {
        setTimeout(() => {
          if (touchState.tapCount === 1) {
            onTap(touch);
            touchState.tapCount = 0;
          }
        }, doubleTapDelay);
      }
    }

    // Handle pan end
    if (touchState.isPanning && changedTouches.length === 1 && onPanEnd) {
      onPanEnd(changedTouches[0]);
      touchState.isPanning = false;
      touchState.panStart = null;
    }

    // Update touch state
    changedTouches.forEach(touch => {
      touchState.touches.delete(touch.identifier);
    });

    if (touchState.touches.size === 0) {
      touchState.initialPinchDistance = 0;
      touchState.isPanning = false;
      touchState.panStart = null;
    }
  }, [
    disabled,
    preventDefaultTouch,
    getTouchPoint,
    onSwipe,
    swipeThreshold,
    swipeVelocityThreshold,
    onTap,
    doubleTapDelay,
    onPanEnd
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const touchState = touchStateRef.current;
      if (touchState.longPressTimer) {
        clearTimeout(touchState.longPressTimer);
      }
    };
  }, []);

  const containerClasses = [
    'touch-interaction-area',
    className,
    preventScroll ? 'touch-interaction-area--prevent-scroll' : '',
    disabled ? 'touch-interaction-area--disabled' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
    </div>
  );
};

// Hook for detecting touch capabilities
export const useTouchCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    hasTouch: false,
    maxTouchPoints: 0,
    supportsForceTouch: false,
    supportsPointerEvents: false
  });

  useEffect(() => {
    const detectCapabilities = () => {
      setCapabilities({
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        supportsForceTouch: 'TouchEvent' in window && 'force' in Touch.prototype,
        supportsPointerEvents: 'PointerEvent' in window
      });
    };

    detectCapabilities();
    window.addEventListener('touchstart', detectCapabilities, { once: true });

    return () => {
      window.removeEventListener('touchstart', detectCapabilities);
    };
  }, []);

  return capabilities;
};

// Hook for touch-friendly drag and drop
export interface TouchDragState {
  isDragging: boolean;
  dragElement: HTMLElement | null;
  position: { x: number; y: number };
  offset: { x: number; y: number };
}

export const useTouchDragDrop = (
  enabled: boolean = true,
  onDragStart?: (_element: HTMLElement, _position: { x: number; y: number }) => void,
  onDragMove?: (_position: { x: number; y: number }) => void,
  onDragEnd?: (_element: HTMLElement, _position: { x: number; y: number }) => void
) => {
  const [dragState, setDragState] = useState<TouchDragState>({
    isDragging: false,
    dragElement: null,
    position: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  const handleDragStart = useCallback((element: HTMLElement, touch: TouchPoint) => {
    if (!enabled) return;

    const rect = element.getBoundingClientRect();
    const offset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };

    setDragState({
      isDragging: true,
      dragElement: element,
      position: { x: touch.clientX, y: touch.clientY },
      offset
    });

    onDragStart?.(element, { x: touch.clientX, y: touch.clientY });
  }, [enabled, onDragStart]);

  const handleDragMove = useCallback((touch: TouchPoint) => {
    if (!dragState.isDragging || !dragState.dragElement) return;

    const position = { x: touch.clientX, y: touch.clientY };

    setDragState(prev => ({
      ...prev,
      position
    }));

    onDragMove?.(position);
  }, [dragState.isDragging, dragState.dragElement, onDragMove]);

  const handleDragEnd = useCallback((touch: TouchPoint) => {
    if (!dragState.isDragging || !dragState.dragElement) return;

    const position = { x: touch.clientX, y: touch.clientY };
    onDragEnd?.(dragState.dragElement, position);

    setDragState({
      isDragging: false,
      dragElement: null,
      position: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    });
  }, [dragState.isDragging, dragState.dragElement, onDragEnd]);

  return {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd
  };
};

export default TouchInteractionArea;