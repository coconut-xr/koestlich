import { Intersection, Vector2, Vector3, Vector4 } from "three";
import { Vector1 } from "./vector.js";
import { RootState, EventManager, events } from "@react-three/fiber";
import { UseBoundStore } from "zustand";
import { Mesh, Plane } from "three";

export type Vector123 = Vector1 | Vector2 | Vector3;

export function saveDivide<V extends Vector123>(target: V, vector: V): V {
  target.divide(vector as any);
  if (!isFinite(target.x)) {
    target.x = 0;
  }
  if ("y" in target && !isFinite(target.y)) {
    target.y = 0;
  }
  if ("z" in target && !isFinite(target.z)) {
    target.z = 0;
  }
  return target;
}

export function saveDivideNumber(v1: number, v2: number): number {
  return v2 === 0 ? 0 : v1 / v2;
}

export function saveDivideScalar<V extends Vector1 | Vector2 | Vector3 | Vector4>(
  target: V,
  scalar: number,
): V {
  if (scalar === 0) {
    target.set(0, 0, 0, 0);
  } else {
    target.divideScalar(scalar);
  }
  return target;
}

const helper = new Vector3();

export function asVector3(vec2: Vector2, z: number): Vector3 {
  return helper.set(vec2.x, vec2.y, z);
}

export function clippingEvents(store: UseBoundStore<RootState>): EventManager<HTMLElement> {
  return {
    ...events(store),
    filter: (intersections) => intersections.filter(isIntersectionClipped),
  };
}

export function isIntersectionClipped(intersection: Intersection): boolean {
  if (
    !(intersection.object instanceof Mesh) ||
    intersection.object.material.clippingPlanes == null
  ) {
    return true;
  }
  const planes = intersection.object.material.clippingPlanes as Array<Plane>;
  for (const plane of planes) {
    if (plane.distanceToPoint(intersection.point) < 0) {
      return false;
    }
  }
  return true;
}
