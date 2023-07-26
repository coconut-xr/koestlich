import { Vector3 } from "three";
import { saveDivide, saveDivideNumber } from "./utils.js";
import { VectorX } from "./vector.js";

export type Transition = (from: VectorX, to: VectorX, delta: number, isScale: boolean) => void;

const zero = new Vector3(0, 0, 0);
const one = new Vector3(1, 1, 1);

export type Transformation = Readonly<{ translate: Vector3; scale: Vector3 }>;

const defaultTransformation: Transformation = { translate: zero, scale: one };

const distanceHelper = new Vector3();

export function applyTransitionOnTransformation(
  transition: Transition,
  global: Transformation,
  local: Transformation,
  { translate: globalTargetTranslate, scale: globalTargetScale }: Transformation,
  { translate: localTargetTranslate, scale: localTargetScale }: Transformation,
  parentCurrent: Transformation = defaultTransformation,
  deltaTime: number,
): void {
  const { translate: globalTranslate, scale: globalScale } = global;
  const { translate: localTranslate, scale: localScale } = local;

  const localDistance = distanceHelper
    .copy(localTranslate)
    .sub(localTargetTranslate)
    .multiply(parentCurrent.scale)
    .lengthSq();
  const globalDistance = globalTranslate.distanceToSquared(globalTargetTranslate);

  if (localDistance < globalDistance) {
    transition(localTranslate, localTargetTranslate, deltaTime, false);
    transition(localScale, localTargetScale, deltaTime, true);

    globalFromLocalTransformation(global, local, parentCurrent);
  } else {
    transition(globalTranslate, globalTargetTranslate, deltaTime, false);
    transition(globalScale, globalTargetScale, deltaTime, true);

    localFromGlobalTransformation(local, global, parentCurrent);
  }
}

const helper = new Vector3();
export function getParentScale(size: Vector3): Vector3 {
  helper.copy(size);
  helper.z = 1;
  return helper;
}

export function localFromGlobalTransformation(
  { translate: localTranslate, scale: localScale }: Transformation,
  { translate: globalTranslate, scale: globalScale }: Transformation,
  parentCurrent: Transformation = defaultTransformation,
): void {
  const parentScale = getParentScale(parentCurrent.scale);
  localFromGlobalTranslate(localTranslate, globalTranslate, parentCurrent.translate, parentScale);
  localFromGlobalScale(localScale, globalScale, parentScale);
}

export function localFromGlobalTranslate(
  local: Vector3,
  global: Vector3,
  parent: Vector3 = zero,
  parentScale: Vector3,
): Vector3 {
  return saveDivide(local.copy(global).sub(parent), parentScale);
}

export function localFromGlobalScale(local: Vector3, global: Vector3, parent: Vector3): Vector3 {
  return saveDivide(local.copy(global), parent);
}

export function globalFromLocalTransformation(
  { translate: globalTranslate, scale: globalScale }: Transformation,
  { translate: localTranslate, scale: localScale }: Transformation,
  parentCurrent: Transformation = defaultTransformation,
): void {
  const parentScale = getParentScale(parentCurrent.scale);
  globalFromLocalTranslate(globalTranslate, localTranslate, parentCurrent.translate, parentScale);
  globalFromLocalScale(globalScale, localScale, parentScale);
}

export function globalFromLocalTranslate(
  global: Vector3,
  local: Vector3,
  parent: Vector3 = zero,
  parentScale: Vector3,
): Vector3 {
  return global.copy(local).multiply(parentScale).add(parent);
}

export function globalFromLocalScale(global: Vector3, local: Vector3, parent: Vector3): Vector3 {
  return global.copy(local).multiply(parent);
}
// eslint-disable-next-line @typescript-eslint/ban-types
const helperMap = new Map<Function, VectorX>();

function getHelperClone(forVec: VectorX): VectorX {
  let fromCopy = helperMap.get(forVec.constructor);
  if (fromCopy == null) {
    fromCopy = forVec.clone();
    helperMap.set(forVec.constructor, fromCopy);
  } else {
    fromCopy.copy(forVec);
  }
  return fromCopy;
}

export function noTransition(from: VectorX, to: VectorX): void {
  from.copy(to);
}

export function linearTransition(speed = 5): (from: VectorX, to: VectorX, delta: number) => void {
  return (from, to, delta) => {
    const fromCopy = getHelperClone(from);
    const distance = from.copy(to).sub(fromCopy).length();
    if (distance <= 0.0001) {
      from.copy(to);
      return;
    }
    from.multiplyScalar(Math.min(1, saveDivideNumber(speed * delta, distance))).add(fromCopy);
  };
}

export function distanceTransition(speed = 5): Transition {
  return (from, to, delta, isScale) => {
    //we take this function to clamp delta between 0-1. The function is asympotic to 1 for x going to infinity and starts at 0,0
    //the weight represents the influence of the to value on the result
    const weight = 1 - 1 / (1 + delta * speed);

    if (!isScale) {
      const helper = getHelperClone(to);
      from.multiplyScalar(1 - weight).add(helper.copy(to).multiplyScalar(weight));
      return;
    }

    computeEachComponent(from, (fromValue, componentName) => {
      const toValue = (to as any)[componentName];

      const mix =
        Math.min(fromValue, toValue) * (1 - weight) + Math.max(fromValue, toValue) * weight;

      if (toValue >= fromValue) {
        return mix;
      }
      //calculate scale inverse (formular based on trying out)
      return saveDivideNumber(fromValue * toValue, mix);
    });
  };
}

const componentNames = ["x", "y", "z", "w"] as const;

function computeEachComponent(
  vec: any,
  callback: (value: number, component: (typeof componentNames)[number]) => number,
) {
  for (const componentName of componentNames) {
    const value = vec[componentName];
    if (value == null) {
      return; //we can return here because no "y" implies no "z", "w" and so on
    }
    vec[componentName] = callback(value, componentName);
  }
}
