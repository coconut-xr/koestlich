import { EventHandlers, ThreeEvent } from "@react-three/fiber/dist/declarations/src/core/events.js";
import { Vector2, Vector3 } from "three";
import { Bucket } from "./bucket.js";

const distanceHelper = new Vector3();
const localPointHelper = new Vector3();

export type ExtendedThreeEvent<T> = ThreeEvent<T> & { preventDefault: () => void };
export type ExtendEventhandler<EventHandler extends EventHandlers[keyof EventHandlers]> =
  EventHandler extends (event: ThreeEvent<infer E>) => void
    ? (event: ExtendedThreeEvent<E>) => void
    : EventHandler;
export type ExtendedEventHandlers = {
  [Key in keyof EventHandlers]?: ExtendEventhandler<EventHandlers[Key]>;
};

function extendEvent<T>(event: ThreeEvent<T>): ExtendedThreeEvent<T> {
  const statefulEvent = Object.assign(event, {
    defaultPrevented: false,
  });
  return Object.assign(statefulEvent, {
    preventDefault: () => (statefulEvent.defaultPrevented = true),
  });
}

export abstract class ScrollHandler implements EventHandlers {
  //TODO: this probably does not work correctly with objects that were scaled via flexbox transformation

  //root object all interactions relate too
  protected abstract readonly bucket: Bucket;
  protected prevInteractionMap = new Map<number, { timestamp: number; point: Vector3 }>();
  protected abstract parent: ScrollHandler | undefined;

  protected scrollVelocity = new Vector2();

  customEvents: ExtendedEventHandlers = {};

  onContextMenu = (event: ThreeEvent<MouseEvent>) => {
    this.customEvents.onContextMenu?.(extendEvent(event));
  };
  onDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    this.customEvents.onDoubleClick?.(extendEvent(event));
  };
  onPointerOver = (event: ThreeEvent<PointerEvent>) => {
    this.customEvents.onPointerOver?.(extendEvent(event));
  };
  onPointerLeave = (event: ThreeEvent<PointerEvent>) => {
    this.customEvents.onPointerLeave?.(extendEvent(event));
  };
  onPointerMissed(event: MouseEvent) {
    this.customEvents.onPointerMissed?.(event);
  }
  onPointerCancel = (event: ThreeEvent<PointerEvent>) => {
    this.customEvents.onPointerCancel?.(extendEvent(event));
  };

  private onPointerNotPressed = (event: ThreeEvent<PointerEvent>) => {
    const pointerState = this.bucket.pointerStateMap.get(event.pointerId);
    if (pointerState == null) {
      return;
    }
    pointerState.pressedHandlers.delete(this);
    if (pointerState.pressedHandlers.size === 0) {
      this.bucket.pointerStateMap.delete(event.pointerId);
    }
  };

  cleanupHandler() {
    for (const [key, set] of this.bucket.pointerStateMap) {
      set.pressedHandlers.delete(this);
      if (set.pressedHandlers.size != 0) {
        continue;
      }
      this.bucket.pointerStateMap.delete(key);
    }
  }

  onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    this.prevInteractionMap.delete(event.pointerId);
    this.customEvents.onPointerUp?.(extendEvent(event));
    this.onPointerNotPressed(event);
  };

  onPointerOut = (event: ThreeEvent<PointerEvent>) => {
    this.prevInteractionMap.delete(event.pointerId);
    this.customEvents.onPointerOut?.(extendEvent(event));
    this.onPointerNotPressed(event);
  };

  onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    this.customEvents.onPointerDown?.(extendEvent(event));
    if (event.defaultPrevented) {
      return;
    }
    let interaction = this.prevInteractionMap.get(event.pointerId);
    if (interaction == null) {
      this.prevInteractionMap.set(
        event.pointerId,
        (interaction = { timestamp: 0, point: new Vector3() }),
      );
    }
    interaction.timestamp = performance.now() / 1000;
    this.bucket.worldToLocal(interaction.point.copy(event.point));

    let pointerState = this.bucket.pointerStateMap.get(event.pointerId);
    if (pointerState == null) {
      this.bucket.pointerStateMap.set(
        event.pointerId,
        (pointerState = {
          isDrag: false,
          pressedHandlers: new Set(),
          pressPoint: interaction.point.clone(),
        }),
      );
    }
    pointerState.pressedHandlers.add(this);
  };

  onPointerEnter = (event: ThreeEvent<PointerEvent>): void => {
    this.customEvents.onPointerEnter?.(extendEvent(event));
    if (event.defaultPrevented || event.buttons != 1) {
      return;
    }
    let interaction = this.prevInteractionMap.get(event.pointerId);
    if (interaction == null) {
      this.prevInteractionMap.set(
        event.pointerId,
        (interaction = { timestamp: 0, point: new Vector3() }),
      );
    }
    interaction.timestamp = performance.now() / 1000;
    this.bucket.worldToLocal(interaction.point.copy(event.point));
  };

  onPointerMove = (event: ThreeEvent<PointerEvent>): void => {
    const prevInteraction = this.prevInteractionMap.get(event.pointerId);
    this.customEvents.onPointerMove?.(extendEvent(event));
    if (event.defaultPrevented || prevInteraction == null) {
      return;
    }

    if (!("pointerId" in event)) {
      return;
    }

    const pointerState = this.bucket.pointerStateMap.get(event.pointerId as number);

    if (pointerState == null) {
      return;
    }

    this.bucket.worldToLocal(localPointHelper.copy(event.point));

    if (
      !pointerState.isDrag &&
      distanceSquaredInXYPlane(localPointHelper, pointerState.pressPoint) >
        this.bucket.pixelDragThresholdSquared
    ) {
      pointerState.isDrag = true;
    }

    if (!pointerState.isDrag) {
      return;
    }

    distanceHelper.copy(localPointHelper).sub(prevInteraction.point);
    const timestamp = performance.now() / 1000;
    const deltaTime = timestamp - prevInteraction.timestamp;

    prevInteraction.point.copy(localPointHelper);
    prevInteraction.timestamp = timestamp;

    if (this.onScroll(distanceHelper.x, distanceHelper.y)) {
      if (deltaTime > 0.01) {
        //more then 10 ms
        this.scrollVelocity.set(distanceHelper.x, distanceHelper.y).divideScalar(deltaTime);
      }
      event.stopPropagation();
    }
  };

  onWheel = (event: ThreeEvent<WheelEvent>): void => {
    this.scrollVelocity.set(0, 0);
    this.customEvents.onWheel?.(extendEvent(event));
    if (event.defaultPrevented || !(event.nativeEvent.target instanceof HTMLElement)) {
      return;
    }
    const xScroll = -event.deltaX;
    const yScroll = event.deltaY;

    if (!this.onScroll(xScroll, yScroll)) {
      return;
    }
    event.stopPropagation();
  };

  onClick = (event: ThreeEvent<MouseEvent>): void => {
    if (
      "pointerId" in event &&
      this.bucket.pointerStateMap.get(event.pointerId as number)?.isDrag
    ) {
      return;
    }
    this.customEvents.onClick?.(extendEvent(event));
  };

  protected abstract onScroll(distanceX: number, distanceY: number): boolean;
}

function distanceSquaredInXYPlane(v1: Vector3, v2: Vector3): number {
  const xDiff = v2.x - v2.x;
  const yDiff = v1.y - v2.y;
  return xDiff * xDiff + yDiff * yDiff;
}
