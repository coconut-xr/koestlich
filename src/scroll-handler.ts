import { EventHandlers, ThreeEvent } from "@react-three/fiber/dist/declarations/src/core/events.js";
import { Object3D, Vector3 } from "three";

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
  protected abstract bucket: Object3D;
  private pointerInteractionMap = new Map<
    number,
    { prevIntersection: Vector3; hasPrevIntersection: boolean }
  >();
  protected abstract parent: ScrollHandler | undefined;
  public abstract readonly precision: number;

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
    this.getPointerInteractionData(event.pointerId).hasPrevIntersection = false;
    this.customEvents.onPointerUp?.(extendEvent(event));
  };

  onPointerOut = (event: ThreeEvent<PointerEvent>) => {
    this.getPointerInteractionData(event.pointerId).hasPrevIntersection = false;
    this.customEvents.onPointerOut?.(extendEvent(event));
  };

  onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    this.customEvents.onPointerDown?.(extendEvent(event));
    if (event.defaultPrevented) {
      return;
    }
    const interactionData = this.getPointerInteractionData(event.pointerId);
    interactionData.hasPrevIntersection = true;
    this.bucket.worldToLocal(interactionData.prevIntersection.copy(event.point));
  };

  onPointerEnter = (event: ThreeEvent<PointerEvent>): void => {
    this.customEvents.onPointerEnter?.(extendEvent(event));
    if (event.defaultPrevented || event.buttons != 1) {
      return;
    }
    const interactionData = this.getPointerInteractionData(event.pointerId);
    interactionData.hasPrevIntersection = true;
    this.bucket.worldToLocal(interactionData.prevIntersection.copy(event.point));
  };

  onPointerMove = (event: ThreeEvent<PointerEvent>): void => {
    const interactionData = this.getPointerInteractionData(event.pointerId);
    this.customEvents.onPointerMove?.(extendEvent(event));
    if (event.defaultPrevented || !interactionData.hasPrevIntersection) {
      return;
    }
    this.bucket.worldToLocal(localPointHelper.copy(event.point));
    distanceHelper.copy(localPointHelper).sub(interactionData.prevIntersection);
    interactionData.prevIntersection.copy(localPointHelper);

    if (this.onScroll(distanceHelper.x, distanceHelper.y)) {
      event.stopPropagation();
    }
  };

  onWheel = (event: ThreeEvent<WheelEvent>): void => {
    this.customEvents.onWheel?.(extendEvent(event));
    if (event.defaultPrevented || !(event.nativeEvent.target instanceof HTMLElement)) {
      return;
    }
    const xScroll = -event.deltaX * this.precision;
    const yScroll = event.deltaY * this.precision;

    if (!this.onScroll(xScroll, yScroll)) {
      return;
    }
    event.stopPropagation();
  };

  onClick = (event: ThreeEvent<MouseEvent>): void => {
    this.customEvents.onClick?.(extendEvent(event));
  };

  private getPointerInteractionData(pointerId: number) {
    let interactionData = this.pointerInteractionMap.get(pointerId);
    if (interactionData == null) {
      this.pointerInteractionMap.set(
        pointerId,
        (interactionData = {
          hasPrevIntersection: false,
          prevIntersection: new Vector3(),
        }),
      );
    }
    return interactionData;
  }

  protected abstract onScroll(distanceX: number, distanceY: number): boolean;
}
