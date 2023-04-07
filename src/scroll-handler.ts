import { EventHandlers, ThreeEvent } from "@react-three/fiber/dist/declarations/src/core/events.js";
import { Object3D, PerspectiveCamera, Plane, Ray, Vector3 } from "three";

const distanceHelper = new Vector3();
const localPointHelper = new Vector3();
const scaleHelper = new Vector3();

const rayHelper = new Ray()
const planeHelper = new Plane()

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
  private prevIntersection = new Vector3();
  private hasPrevIntersection = false;
  private dragDistance: number | undefined;
  protected abstract parent: ScrollHandler | undefined;

  customEvents: ExtendedEventHandlers = {};

  onContextMenu = (event: ThreeEvent<MouseEvent>) => {
    this.customEvents.onContextMenu?.(extendEvent(event));
  };
  onDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!this.isAncestorDragging()) {
      this.customEvents.onDoubleClick?.(extendEvent(event));
    }
    this.dragDistance = undefined;
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
    setTimeout(() => (this.dragDistance = undefined), 0);
    this.hasPrevIntersection = false;
    this.customEvents.onPointerUp?.(extendEvent(event));
  };

  onPointerOut = (event: ThreeEvent<PointerEvent>) => {
    setTimeout(() => (this.dragDistance = undefined), 0);
    this.hasPrevIntersection = false;
    this.customEvents.onPointerOut?.(extendEvent(event));
  };

  onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    this.customEvents.onPointerDown?.(extendEvent(event));
    if (event.defaultPrevented) {
      return;
    }
    this.hasPrevIntersection = true;
    this.bucket.worldToLocal(this.prevIntersection.copy(event.point));
  };

  onPointerEnter = (event: ThreeEvent<PointerEvent>): void => {
    this.customEvents.onPointerEnter?.(extendEvent(event));
    if (event.defaultPrevented || event.buttons != 1) {
      return;
    }
    this.hasPrevIntersection = true;
    this.bucket.worldToLocal(this.prevIntersection.copy(event.point));
  };

  onPointerMove = (event: ThreeEvent<PointerEvent>): void => {
    this.customEvents.onPointerMove?.(extendEvent(event));
    if (event.defaultPrevented || !this.hasPrevIntersection) {
      return;
    }
    this.bucket.worldToLocal(localPointHelper.copy(event.point));
    distanceHelper.copy(localPointHelper).sub(this.prevIntersection);
    this.prevIntersection.copy(localPointHelper);

    if (this.onScroll(distanceHelper.x, distanceHelper.y)) {
      this.dragDistance = distanceHelper.length() + (this.dragDistance ?? 0);
      event.stopPropagation();
    }
  };

  onWheel = (event: ThreeEvent<WheelEvent>): void => {
    this.customEvents.onWheel?.(extendEvent(event));
    if (event.defaultPrevented || !(event.nativeEvent.target instanceof HTMLElement) || !(event.camera instanceof PerspectiveCamera)) {
      return;
    }

    event.camera.getWorldPosition(rayHelper.origin)
    event.camera.getWorldDirection(rayHelper.direction)
    planeHelper.setFromNormalAndCoplanarPoint(rayHelper.direction, event.point)
    const distance = rayHelper.distanceToPlane(planeHelper)
    const heightOfThePlaneWeScrollOn = Math.tan(event.camera.fov / 180 * Math.PI) * distance * 2

    const elementBounds = event.nativeEvent.target.getBoundingClientRect();
    const xScroll = -event.deltaX / elementBounds.width * heightOfThePlaneWeScrollOn * 0.15;
    const yScroll = event.deltaY / elementBounds.height * heightOfThePlaneWeScrollOn * 0.15;

    if (!this.onScroll(xScroll, yScroll)) {
      return;
    }
    event.stopPropagation();
  };

  onClick = (event: ThreeEvent<MouseEvent>): void => {
    if (this.isAncestorDragging()) {
      event.stopPropagation();
      return;
    }
    this.customEvents.onClick?.(extendEvent(event));
  };

  private isAncestorDragging(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let ancestor: ScrollHandler | undefined = this;
    while (ancestor != null) {
      if (ancestor.dragDistance != null && ancestor.dragDistance > 0.05) {
        return true;
      }
      ancestor = ancestor.parent;
    }
    return false;
  }

  protected abstract onScroll(distanceX: number, distanceY: number): boolean;
}
