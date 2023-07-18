import { EventHandlers, ThreeEvent } from "@react-three/fiber/dist/declarations/src/core/events.js";
import { Object3D, Vector2, Vector3 } from "three";

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
  protected abstract readonly bucket: Object3D;
  private prevInteractionMap = new Map<number, { timestamp: number; point: Vector3 }>();
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

  onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    this.prevInteractionMap.delete(event.pointerId);
    this.customEvents.onPointerUp?.(extendEvent(event));
  };

  onPointerOut = this.onPointerUp;

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
    this.bucket.worldToLocal(localPointHelper.copy(event.point));
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
    this.customEvents.onClick?.(extendEvent(event));
  };

  protected abstract onScroll(distanceX: number, distanceY: number): boolean;

  applyScrollVelocity(deltaTime: number): void {
    if (
      this.prevInteractionMap.size > 0 ||
      (this.scrollVelocity.y === 0 && this.scrollVelocity.x === 0)
    ) {
      return;
    }

    this.onScroll(this.scrollVelocity.x * deltaTime, this.scrollVelocity.y * deltaTime);

    this.scrollVelocity.multiplyScalar(0.9); //damping scroll factor

    if (Math.abs(this.scrollVelocity.x) < 0.01) {
      this.scrollVelocity.x = 0;
    }

    if (Math.abs(this.scrollVelocity.y) < 0.01) {
      this.scrollVelocity.y = 0;
    }
  }
}
