import { Color, ColorRepresentation, Mesh, Plane, PlaneGeometry, Vector3, Vector4 } from "three";
import { AnimationConfig, BaseNode, distanceFadeAnimation } from "../node.js";
import { buildRoot } from "../root.js";
import { Vector1 } from "../vector.js";
import { buildComponent } from "../component.js";
import { ReactNode, useEffect } from "react";
import { flexAPI } from "../properties/index.js";
import { BackgroundMaterial } from "../background-material.js";
import { linkBackground, updateBackgroundValues } from "../background.js";
import { InvertOptional } from "./index.js";
import { applyEventHandlers } from "../events.js";
import { ExtendedEventHandlers } from "../scroll-handler.js";
import { YogaProperties } from "@coconut-xr/flex";

const geometry = new PlaneGeometry();
geometry.translate(0.5, -0.5, 0.5);

export type ContainerState = {
  translate: Vector3;
  scale: Vector3;
  backgroundOpacity: Vector1;
  backgroundColor: Vector3;
  borderColor: Vector3;
  borderSize: Vector4;
  borderRadius: Vector4;
  borderOpacity: Vector1;
};

export class ContainerNode extends BaseNode<ContainerState> {
  public target: Readonly<ContainerState> = {
    backgroundColor: new Vector3(),
    backgroundOpacity: new Vector1(),
    translate: new Vector3(),
    scale: new Vector3(),
    borderColor: new Vector3(),
    borderOpacity: new Vector1(),
    borderRadius: new Vector4(),
    borderSize: new Vector4(),
  };
  private backgroundMaterial = new BackgroundMaterial({
    transparent: true,
    toneMapped: false,
  });
  private backgroundMesh = new Mesh(geometry, this.backgroundMaterial);

  applyClippingPlanes(planes: Plane[] | null): void {
    this.backgroundMaterial.clippingPlanes = planes;
    this.backgroundMaterial.needsUpdate = true;
  }

  linkCurrent(current: ContainerState): void {
    //link global transformation directly (more efficiently then in onUpdate)
    linkBackground(current, this.backgroundMesh, this.backgroundMaterial);
  }

  onInit() {
    applyEventHandlers(this.backgroundMesh, this, this.root);
    this.bucket.add(this.backgroundMesh);
  }

  onLayout(): void {
    //nothing to do
  }

  onUpdate(current: ContainerState): void {
    updateBackgroundValues(current, this.backgroundMesh, this.backgroundMaterial);
  }

  onCleanup(): void {
    this.bucket.remove(this.backgroundMesh);
  }
}

const colorHelper = new Color();

export const containerDefaults: Omit<
  InvertOptional<ContainerProperties>,
  keyof YogaProperties | keyof ExtendedEventHandlers
> = {
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  backgroundColor: 0xffffff,
  backgroundOpacity: 1,
  borderOpacity: 1,
  borderColor: 0x0,
  borderRadiusTopLeft: 0,
  borderRadiusTopRight: 0,
  borderRadiusBottomRight: 0,
  borderRadiusBottomLeft: 0,
  animation: distanceFadeAnimation,
};

export function updateContainerProperties(
  node: BaseNode<ContainerState>,
  {
    backgroundColor,
    backgroundOpacity,
    borderRadiusBottomLeft,
    borderRadiusBottomRight,
    borderRadiusTopLeft,
    borderRadiusTopRight,
    borderColor,
    borderOpacity,
    translateX,
    translateY,
    translateZ,
    scaleX,
    scaleY,
    scaleZ,
    animation,
  }: ContainerProperties,
): void {
  node.setManualTransformation(
    translateX ?? containerDefaults["translateX"],
    translateY ?? containerDefaults["translateY"],
    translateZ ?? containerDefaults["translateZ"],
    scaleX ?? containerDefaults["scaleX"],
    scaleY ?? containerDefaults["scaleY"],
    scaleZ ?? containerDefaults["scaleZ"],
  );
  colorHelper.set(backgroundColor ?? containerDefaults["backgroundColor"]);
  node.target.backgroundColor.set(colorHelper.r, colorHelper.g, colorHelper.b);
  colorHelper.set(borderColor ?? containerDefaults["borderColor"]);
  node.target.borderColor.set(colorHelper.r, colorHelper.g, colorHelper.b);

  //default opacity: is 0 if no color is provided
  node.target.backgroundOpacity.set(
    backgroundOpacity ?? (backgroundColor == null ? 0 : containerDefaults["backgroundOpacity"]),
  );
  node.target.borderOpacity.set(
    borderOpacity ?? (borderColor == null ? 0 : containerDefaults["borderOpacity"]),
  );

  node.target.borderRadius.set(
    borderRadiusTopLeft ?? containerDefaults["borderRadiusTopLeft"],
    borderRadiusTopRight ?? containerDefaults["borderRadiusTopRight"],
    borderRadiusBottomRight ?? containerDefaults["borderRadiusBottomRight"],
    borderRadiusBottomLeft ?? containerDefaults["borderRadiusBottomLeft"],
  );
  node.animationConfig = animation ?? containerDefaults["animation"];
}

export function updateEventProperties(
  node: BaseNode,
  {
    onClick,
    onContextMenu,
    onDoubleClick,
    onPointerCancel,
    onPointerDown,
    onPointerEnter,
    onPointerLeave,
    onPointerMove,
    onPointerOut,
    onPointerOver,
    onPointerUp,
    onWheel,
  }: Omit<ExtendedEventHandlers, "onPointerMissed">,
): void {
  node.customEvents.onClick = onClick;
  node.customEvents.onContextMenu = onContextMenu;
  node.customEvents.onDoubleClick = onDoubleClick;
  node.customEvents.onPointerCancel = onPointerCancel;
  node.customEvents.onPointerDown = onPointerDown;
  node.customEvents.onPointerEnter = onPointerEnter;
  node.customEvents.onPointerLeave = onPointerLeave;
  node.customEvents.onPointerMove = onPointerMove;
  node.customEvents.onPointerOut = onPointerOut;
  node.customEvents.onPointerOver = onPointerOver;
  node.customEvents.onPointerUp = onPointerUp;
  node.customEvents.onWheel = onWheel;
}

export type ContainerProperties = YogaProperties & {
  animation?: AnimationConfig;
  backgroundColor?: ColorRepresentation;
  backgroundOpacity?: number;
  borderColor?: ColorRepresentation;
  borderOpacity?: number;
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomRight?: number;
  borderRadiusBottomLeft?: number;
  translateX?: number;
  translateY?: number;
  translateZ?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
} & Omit<ExtendedEventHandlers, "onPointerMissed">;

export function useContainer(
  node: ContainerNode,
  properties: ContainerProperties,
  children: ReactNode | undefined,
): ReactNode | undefined {
  useEffect(() => {
    //updates need to happen inside an effect
    updateContainerProperties(node, properties);
    updateEventProperties(node, properties);
    node.setProperties(properties);
  });
  return children;
}

export const Container = buildComponent(ContainerNode, useContainer, flexAPI);
export const RootContainer = buildRoot(ContainerNode, useContainer, flexAPI);
