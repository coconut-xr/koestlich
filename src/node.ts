import { useStore } from "@react-three/fiber";
import { commitYogaChildren, setter, YogaProperties } from "@coconut-xr/flex";
import { ForwardedRef, useMemo } from "react";
import { Box2, Plane, Vector2, Vector3, Vector4 } from "three";
import { generateUUID } from "three/src/math/MathUtils.js";
import { Bucket } from "./bucket.js";
import { clippingPlanesFromBounds, computeClippingBounds } from "./clipping.js";
import { R3FRoot } from "./events.js";
import { RootStorage } from "./root.js";
import { ScrollHandler } from "./scroll-handler.js";
import {
  applyTransitionOnTransformation,
  distanceTransition,
  getParentScale,
  globalFromLocalTransformation,
  localFromGlobalTransformation,
  noTransition,
  Transformation,
  Transition,
} from "./transition.js";
import { asVector3, saveDivide } from "./utils.js";
import { Vector1, VectorX } from "./vector.js";
import {
  EDGE_BOTTOM,
  EDGE_LEFT,
  EDGE_RIGHT,
  EDGE_TOP,
  OVERFLOW_SCROLL,
  OVERFLOW_VISIBLE,
  Node as YogaNode,
  Yoga,
} from "yoga-wasm-web";

export const zFightingOffset = 0.5;

const helper2 = new Vector2();
const helper3 = new Vector3();

const one2 = new Vector2(1, 1);
const zero2 = new Vector2(0, 0);

const zero = new Vector3(0, 0, 0);
const one = new Vector3(1, 1, 1);

const scrollOffsetCache = new Vector3();

export enum SetPropertyEffect {
  Changed,
  Unchanged,
  UnknownProperty,
}

export type AnimationState = {
  [Key in string]: VectorX;
} & {
  translate: Vector3;
  scale: Vector3;
  borderSize: Vector4;
};

export function cloneState<S extends AnimationState>(state: Readonly<S>): Readonly<S> {
  const result = {} as S;
  for (const [key, value] of Object.entries<VectorX>(state)) {
    result[key as keyof S] = value.clone() as any;
  }
  return result;
}

export type AnimationConfig = {
  toBirthState: (state: object) => void;
  toDeathState: (state: object) => void;
  transition: Transition;
  isDead: (current: object) => boolean;
};

export const distanceFadeAnimation: AnimationConfig = {
  isDead: (state) => {
    if ("backgroundOpacity" in state && state.backgroundOpacity instanceof Vector1) {
      return state.backgroundOpacity.x <= 0.001;
    }
    return true;
  },
  toBirthState: (state) => {
    if ("opacity" in state && state.opacity instanceof Vector1) {
      state.opacity.set(0);
    }
    if ("backgroundOpacity" in state && state.backgroundOpacity instanceof Vector1) {
      state.backgroundOpacity.set(0);
    }
    if ("borderOpacity" in state && state.borderOpacity instanceof Vector1) {
      state.borderOpacity.set(0);
    }
  },
  toDeathState: (state) => {
    if ("opacity" in state && state.opacity instanceof Vector1) {
      state.opacity.set(0);
    }
    if ("backgroundOpacity" in state && state.backgroundOpacity instanceof Vector1) {
      state.backgroundOpacity.set(0);
    }
    if ("borderOpacity" in state && state.borderOpacity instanceof Vector1) {
      state.borderOpacity.set(0);
    }
  },
  transition: distanceTransition(),
};

export const noAnimation: AnimationConfig = {
  isDead: (state) => {
    if ("backgroundOpacity" in state && state.backgroundOpacity instanceof Vector1) {
      return state.backgroundOpacity.x <= 0.001;
    }
    return true;
  },
  toBirthState: (state) => {
    if ("opacity" in state && state.opacity instanceof Vector1) {
      state.opacity.set(0);
    }
    if ("backgroundOpacity" in state && state.backgroundOpacity instanceof Vector1) {
      state.backgroundOpacity.set(0);
    }
    if ("borderOpacity" in state && state.borderOpacity instanceof Vector1) {
      state.borderOpacity.set(0);
    }
  },
  toDeathState: (state) => {
    if ("opacity" in state && state.opacity instanceof Vector1) {
      state.opacity.set(0);
    }
    if ("backgroundOpacity" in state && state.backgroundOpacity instanceof Vector1) {
      state.backgroundOpacity.set(0);
    }
    if ("borderOpacity" in state && state.borderOpacity instanceof Vector1) {
      state.borderOpacity.set(0);
    }
  },
  transition: noTransition,
};

const minDepth = zFightingOffset;

export abstract class BaseNode<S extends AnimationState = AnimationState> extends ScrollHandler {
  readonly yoga: YogaNode;
  readonly children: Array<BaseNode> = [];
  protected nextParent: BaseNode | undefined;
  protected parent: BaseNode | undefined;

  protected properties: YogaProperties = {};

  public abstract target: Readonly<S>;
  protected current: Readonly<S> | undefined;

  protected currentLocalTransformation: Transformation = {
    translate: new Vector3(),
    scale: new Vector3(),
  };
  protected targetLocalTransformation: Transformation = {
    translate: new Vector3(),
    scale: new Vector3(),
  };

  protected measuredLocalTranslate = new Vector2();
  protected measuredLocalScale = new Vector2();

  protected measuredGlobalScale = new Vector2();
  protected measuredGlobalPadding = new Vector4();

  //means that scales above 1 are overflowing (multiply with current.scale to get the global value)
  protected measuredNormalizedContentBounds = new Box2();

  protected manualTransformation = { translate: new Vector3(), scale: new Vector3(1, 1, 1) };

  protected normalizedScrollOffset = new Vector3();
  protected depth: number;

  protected clippingPlanes: Array<Plane> | null = null;
  protected overflowClipped = false;
  protected clippingBounds = new Vector4();

  protected isDying = false;

  public index = 0;

  public animationConfig: AnimationConfig = distanceFadeAnimation;

  constructor(
    yoga: Yoga,
    public readonly id: string,
    public readonly precision: number,
    protected requestLayoutCalculation: () => void,
    protected bucket: Bucket,
    protected root: R3FRoot,
    private cleanupReference: () => void,
  ) {
    super();
    this.depth = minDepth * this.precision;
    this.yoga = yoga.Node.create();
  }

  protected onScroll(distanceX: number, distanceY: number): boolean {
    if (this.yoga.getOverflow() != OVERFLOW_SCROLL) {
      return false;
    }

    scrollOffsetCache.copy(this.normalizedScrollOffset);

    const scaleX = this.current?.scale.x ?? 1;
    const scaleY = this.current?.scale.y ?? 1;

    this.normalizedScrollOffset.x += scaleX === 0 ? 0 : distanceX / scaleX;
    this.normalizedScrollOffset.y += scaleY === 0 ? 0 : distanceY / scaleY;

    this.updateScroll();
    if (
      scrollOffsetCache.x != this.normalizedScrollOffset.x ||
      scrollOffsetCache.y != this.normalizedScrollOffset.y
    ) {
      this.updateTransformationTarget(true);
      return true;
    }

    return false;
  }

  private updateScroll(): void {
    if (this.yoga.getOverflow() != OVERFLOW_SCROLL) {
      this.normalizedScrollOffset.x = 0;
      this.normalizedScrollOffset.y = 0;
    }
    helper2.copy(this.measuredNormalizedContentBounds.max).sub(one2).max(zero2);
    this.normalizedScrollOffset.x = Math.min(
      -this.measuredNormalizedContentBounds.min.x,
      Math.max(-helper2.x, this.normalizedScrollOffset.x),
    );
    this.normalizedScrollOffset.y = Math.max(
      this.measuredNormalizedContentBounds.min.y,
      Math.min(helper2.y, this.normalizedScrollOffset.y),
    );
  }

  /**
   * should only be executed on the root node
   */
  calculateLayout(): void {
    this.commitChildren();
    this.yoga.calculateLayout();
    this.measureLayout();
    this.updateLayout();
  }

  private commitChildren(): void {
    const aliveChildrenNodes = this.children
      .sort((a, b) => a.index - b.index)
      .filter(({ isDying }) => !isDying)
      .map(({ yoga: node }) => node);
    commitYogaChildren(this.yoga, aliveChildrenNodes);
    this.children.forEach((child) => child.commitChildren());
  }

  destroy(): void {
    if (this.nextParent == null) {
      this.hardDestroy();
      return;
    }
    this.isDying = true;
    this.animationConfig.toDeathState(this.target);
  }

  private hardDestroy(): void {
    if (this.nextParent != null) {
      this.nextParent.removeChild(this);
    }
    this.cleanupReference();
    this.cleanupHandler();
    this.onCleanup();
  }

  private measureLayout(): void {
    if (this.isDying) {
      return;
    }

    this.measuredNormalizedContentBounds.min.set(0, 0);
    this.measuredNormalizedContentBounds.max.set(0, 0);

    const top = this.yoga.getComputedTop() * this.precision;
    const right = this.yoga.getComputedRight() * this.precision;
    const bottom = this.yoga.getComputedBottom() * this.precision;
    const left = this.yoga.getComputedLeft() * this.precision;
    const width = this.yoga.getComputedWidth() * this.precision;
    const height = this.yoga.getComputedHeight() * this.precision;
    const paddingTop = this.yoga.getComputedPadding(EDGE_TOP) * this.precision;
    const paddingLeft = this.yoga.getComputedPadding(EDGE_LEFT) * this.precision;
    const paddingRight = this.yoga.getComputedPadding(EDGE_RIGHT) * this.precision;
    const paddingBottom = this.yoga.getComputedPadding(EDGE_BOTTOM) * this.precision;
    const borderTop = this.yoga.getComputedBorder(EDGE_TOP) * this.precision;
    const borderRight = this.yoga.getComputedBorder(EDGE_RIGHT) * this.precision;
    const borderBottom = this.yoga.getComputedBorder(EDGE_BOTTOM) * this.precision;
    const borderLeft = this.yoga.getComputedBorder(EDGE_LEFT) * this.precision;

    this.target.borderSize.set(borderTop, borderRight, borderBottom, borderLeft);

    this.measuredGlobalPadding.set(paddingTop, paddingRight, paddingBottom, paddingLeft);

    this.measuredGlobalScale.set(width, height);
    saveDivide(
      this.measuredLocalTranslate.set(left, -top),
      this.nextParent?.measuredGlobalScale ?? one,
    );
    saveDivide(
      this.measuredLocalScale.set(width, height),
      this.nextParent?.measuredGlobalScale ?? one,
    );

    //extend parent's content bounds (can use nextParent here since it will be set directly after in measureLayout)
    if (this.nextParent != null) {
      //extend bottom right
      helper2.set(left + width + right, top + height + bottom);
      helper2.x += this.nextParent.target.borderSize.y + this.nextParent.measuredGlobalPadding.y; //right
      helper2.y += this.nextParent.target.borderSize.z + this.nextParent.measuredGlobalPadding.z; //bottom
      saveDivide(helper2, this.nextParent?.measuredGlobalScale ?? one);
      this.nextParent.measuredNormalizedContentBounds.max.max(helper2);

      //extend top left
      helper2.set(left, top);
      helper2.x -= this.nextParent.target.borderSize.w + this.nextParent.measuredGlobalPadding.w; //left
      helper2.y -= this.nextParent.target.borderSize.x + this.nextParent.measuredGlobalPadding.x; //top
      saveDivide(helper2, this.nextParent?.measuredGlobalScale ?? one);
      this.nextParent.measuredNormalizedContentBounds.min.min(helper2);
    }

    for (const child of this.children) {
      child.measureLayout();
    }
  }

  private updateLayout(): void {
    if (this.isDying) {
      this.updateTransformationTarget(true);
      return;
    }

    this.overflowClipped = this.yoga.getOverflow() != OVERFLOW_VISIBLE;

    if (this.current == null) {
      this.onInit();
    } else if (this.parent != this.nextParent) {
      localFromGlobalTransformation(
        this.currentLocalTransformation,
        this.current,
        this.nextParent?.current,
      );
      localFromGlobalTransformation(
        this.targetLocalTransformation,
        this.target,
        this.nextParent?.target,
      );
    }
    this.parent = this.nextParent;

    this.updateScroll();
    this.updateTransformationTarget(false);

    this.onLayout();

    if (this.current == null) {
      this.current = cloneState(this.target);
      localFromGlobalTransformation(
        this.targetLocalTransformation,
        this.target,
        this.parent?.target,
      );
      globalFromLocalTransformation(
        this.current,
        this.targetLocalTransformation,
        this.parent?.current,
      );
      this.linkCurrent(this.current);
      this.animationConfig.toBirthState(this.current);
      localFromGlobalTransformation(
        this.currentLocalTransformation,
        this.current,
        this.parent?.current,
      );
    }

    for (const child of this.children) {
      child.updateLayout();
    }
  }

  setProperties(properties: YogaProperties): void {
    const prevProperties = this.properties;
    this.properties = properties;
    if (applyFlexProperties(this.yoga, this.precision, this.properties, prevProperties)) {
      this.requestLayoutCalculation();
    }
  }

  abstract onInit(): void;

  abstract onLayout(): void;

  abstract onUpdate(current: Readonly<S>): void;

  abstract onCleanup(): void;

  abstract linkCurrent(current: S): void;

  abstract applyClippingPlanes(planes: Array<Plane> | null): void;

  setManualTransformation(
    x: number,
    y: number,
    z: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
  ): void {
    const currentManualScale = this.manualTransformation.scale;
    const currentManualTranslate = this.manualTransformation.translate;

    let changed = false;

    if (
      currentManualScale.x != scaleX ||
      currentManualScale.y != scaleY ||
      currentManualScale.z != scaleZ
    ) {
      changed = true;
      currentManualScale.set(scaleX, scaleY, scaleZ);
    }

    if (
      currentManualTranslate.x != x ||
      currentManualTranslate.y != y ||
      currentManualTranslate.z != z
    ) {
      changed = true;
      currentManualTranslate.set(x, y, z);
    }

    if (changed) {
      this.updateTransformationTarget(true);
    }
  }

  setDepth(depth: number): void {
    const d = Math.max(minDepth * this.precision, depth);
    if (this.depth === d) {
      return;
    }
    this.depth = d;
    this.updateTransformationTarget(true);
  }

  setParent(parent: BaseNode | undefined): boolean {
    this.isDying = false;
    if (this.nextParent === parent) {
      return false;
    }
    if (this.nextParent != null) {
      this.nextParent.removeChild(this);
    }
    this.nextParent = parent;
    this.nextParent?.children.push(this);
    return true;
  }

  private removeChild(node: BaseNode): void {
    const i = this.children.indexOf(node);
    if (i === -1) {
      return;
    }
    this.children.splice(i, 1);

    if (
      this.children.length === 0 &&
      this.isDying &&
      this.current != null &&
      this.animationConfig.isDead(this.current)
    ) {
      this.hardDestroy();
    }
  }

  update(deltaTime: number): void {
    if (this.current == null) {
      return;
    }

    this.applyScrollVelocity(deltaTime);

    for (const [key, value] of Object.entries(this.target)) {
      if (key != "translate" && key != "scale") {
        this.animationConfig.transition(this.current[key], value, deltaTime, false);
      }
    }
    applyTransitionOnTransformation(
      this.animationConfig.transition,
      this.current,
      this.currentLocalTransformation,
      this.target,
      this.targetLocalTransformation,
      this.parent?.current,
      deltaTime,
    );

    if (this.children.length === 0 && this.isDying && this.animationConfig.isDead(this.current)) {
      this.hardDestroy();
      return;
    }

    //either overflow is hidden/scroll or the parent has clipping planes
    if (this.overflowClipped || this.parent?.clippingPlanes != null) {
      //create clipping planes
      if (this.clippingPlanes == null) {
        this.clippingPlanes = [new Plane(), new Plane(), new Plane(), new Plane()];
        this.applyClippingPlanes(this.clippingPlanes);
      }

      //compute the clipping bounds (in the ui coordinate system) so that they can be used from the child
      computeClippingBounds(
        this.current,
        this.clippingBounds,
        this.parent?.clippingPlanes != null ? this.parent.clippingBounds : undefined,
        this.overflowClipped,
      );

      clippingPlanesFromBounds(this.clippingPlanes, this.clippingBounds, this.precision);

      //subtract the border for the children
      this.clippingBounds.sub(this.current.borderSize);

      //apply the global matrix
      for (const plane of this.clippingPlanes) {
        plane.applyMatrix4(this.bucket.matrixWorld);
      }
    } else if (this.clippingPlanes != null) {
      this.clippingPlanes = null;
      this.applyClippingPlanes(null);
    }

    for (const child of this.children) {
      child.update(deltaTime);
    }

    this.onUpdate(this.current);
  }

  /**
   * called after the parent updates it's transformation (e.g. through a layout update, changing the transformation, or the depth)
   * accumulates: parent target translate, parent innerOffset, own target offset, own target custom transform
   */
  private updateTransformationTarget(updateChildren: boolean): void {
    //global scale
    this.target.scale
      .copy(asVector3(this.measuredLocalScale, this.depth))
      .multiply(this.manualTransformation.scale)
      .multiply(getParentScale(this.parent?.target.scale ?? one));

    //global translation
    this.target.translate
      .copy(
        asVector3(
          this.measuredLocalTranslate,
          this.parent == null ? 0 : this.parent.depth + zFightingOffset * this.precision,
        ),
      )
      .add(this.parent?.normalizedScrollOffset ?? zero)
      .add(
        saveDivide(
          helper3.copy(this.manualTransformation.translate),
          asVector3(this.measuredGlobalScale, 1),
        ),
      )
      .multiply(getParentScale(this.parent?.target.scale ?? one))
      .add(this.parent?.target.translate ?? zero);

    localFromGlobalTransformation(this.targetLocalTransformation, this.target, this.parent?.target);

    if (updateChildren) {
      for (const child of this.children) {
        child.updateTransformationTarget(true);
      }
    }
  }
}

export type NodeClass<T extends BaseNode> = {
  new (
    yoga: Yoga,
    id: string,
    precision: number,
    requestLayoutCalculation: () => void,
    bucket: Bucket,
    root: R3FRoot,
    cleanupReference: () => void,
  ): T;
};

function applyFlexProperties(
  yoga: YogaNode,
  precision: number,
  properties: YogaProperties,
  prevProperties: YogaProperties | undefined,
): boolean {
  const propertyEntries = Object.entries(properties);
  let changed = false;
  if (prevProperties == null) {
    for (const [key, value] of propertyEntries) {
      const set = setter[key as keyof typeof setter];
      if (set == null) {
        continue;
      }
      set(yoga, precision, value as any);
      changed = true;
    }
    return changed;
  }
  const prevPropertiesKeys = new Set(Object.keys(prevProperties));

  for (const [key, value] of propertyEntries) {
    const set = setter[key as keyof typeof setter];
    if (set != null && value != prevProperties[key as keyof YogaProperties]) {
      set(yoga, precision, value as any);
      changed = true;
    }
    prevPropertiesKeys.delete(key);
  }
  for (const key of prevPropertiesKeys) {
    const set = setter[key as keyof typeof setter];
    if (set == null) {
      continue;
    }
    set(yoga, precision, undefined);
    changed = true;
  }

  return changed;
}

export function useNode<T extends BaseNode>(
  { yoga, precision, bucket, nodeMap, requestLayoutCalculation }: RootStorage,
  parentId: string | undefined,
  index: number | undefined,
  providedId: string | undefined,
  nodeClass: NodeClass<T>,
  ref: ForwardedRef<T | undefined> | undefined,
): T {
  const root = useStore();
  return useMemo(() => {
    const id =
      providedId ?? (index == null || parentId == null ? generateUUID() : `${parentId}-${index}`);
    let node = nodeMap.get(id) as T | undefined;
    if (node == null || node.constructor.name !== nodeClass.name) {
      node = new nodeClass(
        yoga,
        id,
        precision,
        requestLayoutCalculation,
        bucket,
        root,
        nodeMap.delete.bind(nodeMap, id),
      );
      nodeMap.set(id, node);
    }
    if (ref == null) {
      return node;
    }
    if (typeof ref == "function") {
      ref(node);
    } else {
      ref.current = node;
    }
    return node;
  }, [root, nodeMap, bucket, precision, providedId, nodeClass, yoga, parentId]);
}
