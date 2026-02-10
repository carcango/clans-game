interface MapInputHandlers {
  dragThresholdPx: number;
  onPrimaryClick: (clientX: number, clientY: number) => void;
  onRotate: (deltaX: number) => void;
  onZoom: (deltaY: number) => void;
}

export function attachMapInput(canvas: HTMLCanvasElement, handlers: MapInputHandlers) {
  let rotatePointerId: number | null = null;
  let leftPointerId: number | null = null;
  let leftDown = false;
  let leftStartX = 0;
  let leftStartY = 0;
  let leftDragged = false;
  let lastRotateX = 0;

  const onPointerDown = (event: PointerEvent) => {
    if (event.button === 1 || event.button === 2) {
      rotatePointerId = event.pointerId;
      lastRotateX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    if (event.button === 0) {
      leftPointerId = event.pointerId;
      leftDown = true;
      leftDragged = false;
      leftStartX = event.clientX;
      leftStartY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (rotatePointerId === event.pointerId) {
      const deltaX = event.clientX - lastRotateX;
      lastRotateX = event.clientX;
      handlers.onRotate(deltaX);
      return;
    }

    if (!leftDown || leftPointerId !== event.pointerId) {
      return;
    }

    const dragDistance = Math.hypot(event.clientX - leftStartX, event.clientY - leftStartY);
    if (dragDistance >= handlers.dragThresholdPx) {
      leftDragged = true;
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    if (rotatePointerId === event.pointerId) {
      rotatePointerId = null;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (!leftDown || leftPointerId !== event.pointerId) {
      return;
    }

    const wasDragged = leftDragged;
    leftDown = false;
    leftDragged = false;
    leftPointerId = null;

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (!wasDragged) {
      handlers.onPrimaryClick(event.clientX, event.clientY);
    }
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (rotatePointerId === event.pointerId) {
      rotatePointerId = null;
    }

    if (leftPointerId === event.pointerId) {
      leftPointerId = null;
      leftDown = false;
      leftDragged = false;
    }

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    handlers.onZoom(event.deltaY);
  };

  const onContextMenu = (event: Event) => {
    event.preventDefault();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', onContextMenu);

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerCancel);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('contextmenu', onContextMenu);
  };
}
