import { Object3D, RenderItem, TextureLoader, Vector3, WebGLRenderer } from "three";
import { Bucket } from "./bucket.js";

const normalHelper = new Vector3();
const positionNormalHelper = new Vector3();

export const cameraWorldPosition = new Vector3();

function reversePainterSortStable(a: RenderItem, b: RenderItem) {
  if (a.groupOrder !== b.groupOrder) {
    return a.groupOrder - b.groupOrder;
  }
  if (a.renderOrder !== b.renderOrder) {
    return a.renderOrder - b.renderOrder;
  }
  const aBucket = getBucketParent(a.object);
  const bBucket = getBucketParent(b.object);

  if (aBucket != null) {
    aBucket.screenSpaceZ ??= a.z;
    a.z = aBucket.screenSpaceZ;
  }
  if (bBucket != null) {
    bBucket.screenSpaceZ ??= b.z;
    b.z = bBucket.screenSpaceZ;
  }

  if (aBucket != null && aBucket === bBucket) {
    aBucket.getWorldPosition(positionNormalHelper).sub(cameraWorldPosition);
    let distance = b.object.position.z - a.object.position.z;
    if (positionNormalHelper.dot(aBucket.getWorldDirection(normalHelper)) < 0) {
      distance = -distance;
    }
    return distance;
  }
  if (a.z !== b.z) {
    return b.z - a.z;
  }
  return a.id - b.id;
}

export function patchRenderOrder(renderer: WebGLRenderer): void {
  renderer.setTransparentSort(reversePainterSortStable);
}

//TODO: replace with reference to bucket
function getBucketParent(object: Object3D): Bucket | undefined {
  if (object.parent == null) {
    return undefined;
  }
  if (object.parent instanceof Bucket) {
    return object.parent;
  }
  return getBucketParent(object.parent);
}

export const PlatformConstants = {
  TextureLoader: TextureLoader,
};

export * from "./vector.js";
export * from "./utils.js";
export * from "./bucket.js";
export * from "./background-material.js";
export * from "./background.js";
export * from "./scroll-handler.js";
export * from "./transition.js";
export * from "./transition.js";
export * from "./node.js";
export * from "./root.js";
export * from "./component.js";
export * from "./properties/index.js";
export * from "./components/index.js";
