import {
  Box3,
  BoxGeometry,
  Color,
  ColorRepresentation,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Object3D,
  Plane,
  PlaneGeometry,
  Vector3,
  Vector4,
} from "three";
import { AnimationConfig, BaseNode, distanceFadeAnimation } from "../node.js";
import { buildRoot } from "../root.js";
import { Vector1 } from "../vector.js";
import { buildComponent } from "../component.js";
import { useLoader } from "@react-three/fiber";
import { ReactNode, useEffect, useMemo } from "react";
import { flexAPI } from "../properties/index.js";
import { ContainerState, updateEventProperties } from "./container.js";
import { GLTFLoader } from "three-stdlib/loaders/GLTFLoader.js";
import { InvertOptional } from "./text.js";
import { saveDivide } from "../utils.js";
import { applyEventHandlers } from "../events.js";
import { SVGLoader } from "three-stdlib/loaders/SVGLoader.js";
import { ExtendedEventHandlers } from "../scroll-handler.js";
import { YogaProperties } from "@coconut-xr/flex";

const geometry = new PlaneGeometry();
geometry.translate(0.5, -0.5, 0);

const one = new Vector3(1, 1, 1);

const vectorHelper = new Vector3();

export type Object3DState = {
  opacity: Vector1;
  overwriteDefaultColor: Vector1;
  color: Vector3;
} & Omit<ContainerState, "borderColor" | "borderRadius" | "borderOpacity">;

export class Object3DNode extends BaseNode<Object3DState> {
  public target: Readonly<Object3DState> = {
    opacity: new Vector1(),
    translate: new Vector3(),
    scale: new Vector3(),
    backgroundColor: new Vector3(),
    backgroundOpacity: new Vector1(),
    overwriteDefaultColor: new Vector1(),
    color: new Vector3(),
    borderSize: new Vector4(),
  };

  private group = new Group();
  private object: Object3D | undefined;
  private depthRatio = 0;
  private overwrittenDepth: number | undefined;

  applyClippingPlanes(planes: Plane[] | null): void {
    this.group.traverse((object) => {
      if (object instanceof Mesh) {
        object.material.clippingPlanes = planes;
        object.material.needsUpdate = true;
      }
    });
  }

  linkCurrent(current: Object3DState): void {
    //link global transformation directly (more efficiently then in onUpdate)
    this.group.position.copy(current.translate);
    current.translate = this.group.position;

    this.group.scale.copy(current.scale);
    current.scale = this.group.scale;
  }

  /**
   * @param object normalized (width, height, depth = 1, top, left = 0)
   */
  setObject(object: Object3D, depthRatio: number, overwrittenDepth: number | undefined): void {
    this.depthRatio = depthRatio;
    this.overwrittenDepth = overwrittenDepth;

    if (this.object === object) {
      return;
    }

    if (this.object != null) {
      this.group.remove(this.object);
    }

    this.object = object;
    this.group.add(this.object);

    this.applyClippingPlanes(this.clippingPlanes);
    this.updateDepth();
  }

  onInit() {
    this.bucket.add(this.group);
    applyEventHandlers(this.group, this, this.root);
  }

  onLayout(): void {
    this.updateDepth();
  }

  private updateDepth(): void {
    if (this.overwrittenDepth != null) {
      this.setDepth(this.overwrittenDepth);
      return;
    }
    this.setDepth(this.depthRatio * this.target.scale.x);
  }

  onUpdate(current: Object3DState): void {
    this.group.traverse((object) => {
      if (object instanceof Mesh) {
        object.material.opacity = current.opacity.x;
        vectorHelper
          .copy(object.userData.defaultColor ?? one)
          .lerp(current.color, current.overwriteDefaultColor.x);
        object.material.color.setRGB(vectorHelper.x, vectorHelper.y, vectorHelper.z);
      }
    });

    this.group.visible = current.opacity.x > 0.001;
  }

  onCleanup(): void {
    this.bucket.remove(this.group);
  }
}

const scaleHelper = new Vector3();

const boundsHelper = new Box3();

export type BaseObject3DProperties = YogaProperties & {
  animation?: AnimationConfig;
  color?: ColorRepresentation;
  opacity?: number;
  depth?: number;
  translateX?: number;
  translateY?: number;
  translateZ?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
} & Omit<ExtendedEventHandlers, "onPointerMissed">;

export type Object3DProperties = { object: Object3D } & BaseObject3DProperties;

const colorHelper = new Color();

const minVector = new Vector3(0.00001, 0.00001, 0.00001);

export function useObject(
  node: Object3DNode,
  {
    object: child,
    color,
    depth,
    opacity,
    animation,
    translateX,
    translateY,
    translateZ,
    scaleX,
    scaleY,
    scaleZ,
    ...props
  }: Object3DProperties,
  children: ReactNode | undefined,
  setAspectRatio = false,
): ReactNode | undefined {
  const [object, ratio, depthRatio] = useMemo(() => {
    //store default color
    child.traverse((object) => {
      if (object instanceof Mesh) {
        object.material = object.material.clone();
        object.material.transparent = true;
        object.material.needsUpdate = true;
        const { r, g, b } = object.material.color;
        object.userData.defaultColor = new Vector3(r, g, b);
      }
    });

    //wrap in object so that the origin is on the top/left
    const object = new Object3D();
    object.add(child);
    object.updateMatrixWorld();
    //order is here important: since the children must be applied to the new object in order to compute the bounds unrelated to its former parents
    boundsHelper.setFromObject(child);
    boundsHelper.getSize(scaleHelper);
    scaleHelper.max(minVector);
    saveDivide(object.scale.set(1, 1, 1), scaleHelper);
    saveDivide(
      object.position.set(-boundsHelper.min.x, -boundsHelper.max.y, -boundsHelper.min.z),
      scaleHelper,
    );
    return [object, scaleHelper.x / scaleHelper.y, scaleHelper.z / scaleHelper.x];
  }, [child]);
  useEffect(() => {
    //updates in use effect to respect the lifcycles
    node.animationConfig = animation ?? distanceFadeAnimation;
    node.target.opacity.set(opacity ?? objectDefaults["opacity"]);

    node.setManualTransformation(
      translateX ?? objectDefaults["translateX"],
      translateY ?? objectDefaults["translateY"],
      translateZ ?? objectDefaults["translateZ"],
      scaleX ?? objectDefaults["scaleX"],
      scaleY ?? objectDefaults["scaleY"],
      scaleZ ?? objectDefaults["scaleZ"],
    );

    if (color != null) {
      colorHelper.set(color);
      node.target.color.set(colorHelper.r, colorHelper.g, colorHelper.b);
      node.target.overwriteDefaultColor.set(1);
    } else {
      node.target.overwriteDefaultColor.set(0);
    }
    node.setObject(object, depthRatio, depth);

    updateEventProperties(node, props);

    if (setAspectRatio) {
      props.aspectRatio = ratio;
    }
    node.setProperties(props);
  });
  return children;
}

export type LoadableObjectProperties = {
  url: string;
} & BaseObject3DProperties;

export const objectDefaults: Omit<
  InvertOptional<BaseObject3DProperties>,
  keyof YogaProperties | "depth" | "color" | keyof ExtendedEventHandlers
> = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  animation: distanceFadeAnimation,
};

const boxGeometry = new BoxGeometry();
boxGeometry.translate(0.5, -0.5, 0.5);

export function useBox(
  node: Object3DNode,
  props: BaseObject3DProperties,
  children: ReactNode | undefined,
): ReactNode | undefined {
  const object = useMemo(
    () => new Mesh(boxGeometry, new MeshBasicMaterial({ toneMapped: false, transparent: true })),
    [],
  );
  return useObject(node, { object, ...props }, children, false);
}

export function useGLTF(
  node: Object3DNode,
  { url, ...props }: LoadableObjectProperties,
  children: ReactNode | undefined,
): ReactNode | undefined {
  const result = useLoader(GLTFLoader, url);
  const object = useMemo(() => result.scene.clone(true), [result]);
  return useObject(node, { object, ...props }, children, true);
}

export function useSVG(
  node: Object3DNode,
  { url, ...props }: LoadableObjectProperties,
  children: ReactNode | undefined,
): ReactNode | undefined {
  const result = useLoader(SVGLoader, url);
  const object = useMemo(() => {
    const object = new Object3D();
    let i = 0;
    for (const path of result.paths) {
      const shapes = SVGLoader.createShapes(path);
      const material = new MeshPhongMaterial({
        color: path.color,
        transparent: true,
        toneMapped: false,
      });
      for (const shape of shapes) {
        const geometry = new ExtrudeGeometry(shape, {
          depth: 1,
          bevelEnabled: false,
        });
        const mesh = new Mesh(geometry, material);
        mesh.scale.y = -1;
        mesh.position.z = i++ * node.precision;
        object.add(mesh);
      }
    }
    return object;
  }, [result]);
  return useObject(node, { object, ...props }, children, true);
}

export const GLTF = buildComponent(Object3DNode, useGLTF, flexAPI);
export const RootGLTF = buildRoot(Object3DNode, useGLTF, flexAPI);

export const SVG = buildComponent(Object3DNode, useSVG, flexAPI);
export const RootSVG = buildRoot(Object3DNode, useSVG, flexAPI);

export const Box = buildComponent(Object3DNode, useBox, flexAPI);
export const RootBox = buildRoot(Object3DNode, useBox, flexAPI);

export const Object = buildComponent(Object3DNode, useObject, flexAPI);
export const RootObject = buildRoot(Object3DNode, useObject, flexAPI);
