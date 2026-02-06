import { useRef, useEffect, useCallback } from 'react';
import { InputState } from '../types/game';

export function useInputManager() {
  const inputRef = useRef<InputState>({
    keys: {},
    mouseDown: {},
    mouseDelta: { x: 0, y: 0 },
  });

  useEffect(() => {
    const input = inputRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      input.keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      input.keys[e.code] = false;
    };
    const onMouseDown = (e: MouseEvent) => {
      input.mouseDown[e.button] = true;
      e.preventDefault();
    };
    const onMouseUp = (e: MouseEvent) => {
      input.mouseDown[e.button] = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        input.mouseDelta.x += e.movementX;
        input.mouseDelta.y += e.movementY;
      }
    };
    const onContextMenu = (e: Event) => e.preventDefault();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('contextmenu', onContextMenu);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

  const requestPointerLock = useCallback((element: HTMLElement) => {
    element.requestPointerLock();
  }, []);

  return { inputRef, requestPointerLock };
}
