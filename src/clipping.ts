import { Plane, Vector3, Vector4 } from "three";
import { zFightingOffset } from "./node.js";
import { Transformation } from "./transition.js";

const TopDownVector = new Vector3(0, -1, 0);
const RightToLeftVector = new Vector3(-1, 0, 0);
const BottomUpVector = new Vector3(0, 1, 0);
const LeftToRightVector = new Vector3(1, 0, 0);

export function computeClippingBounds(
  { translate, scale }: Transformation,
  target: Vector4,
  parentClippingBounds: Vector4 | undefined,
  overflowClipped: boolean,
): void {
  if (overflowClipped) {
    //left and top offsets should be negative
    //right and bottom offsets should be positive
    target.set(
      translate.y, //top
      translate.x + scale.x, //right
      -translate.y + scale.y, //bottom
      -translate.x, //left
    );
  } else {
    target.set(Infinity, Infinity, Infinity, Infinity);
  }

  if (parentClippingBounds != null) {
    //since left & top offset are negative and bottom & right offsets are positive we can minimize here to get the smaller bounds
    target.min(parentClippingBounds);
  }
}

export function clippingPlanesFromBounds(
  target: Array<Plane>,
  clippingBounds: Vector4,
  precision: number,
): void {
  const [topDown, rightToLeft, bottomUp, leftToRight] = target;
  topDown.normal.copy(TopDownVector);
  rightToLeft.normal.copy(RightToLeftVector);
  bottomUp.normal.copy(BottomUpVector);
  leftToRight.normal.copy(LeftToRightVector);

  //values that correspond to 0.5 (x/y)
  //topDown.constant = -0.5
  //rightToLeft.constant = 0.5
  //bottomUp.constant = 0.5
  //leftToRight.constant = -0.5

  const scaledClippingOffset = zFightingOffset * precision;

  //already negative since the top offset is negative
  topDown.constant = clippingBounds.x + scaledClippingOffset; //clipping positive since we want to move (reduce) the clipping to the top

  //already positive since the right offset is already positive
  rightToLeft.constant = clippingBounds.y + scaledClippingOffset; //clipping positive since we want to move (increase) the clipping to the right

  //already positive since the bottom offset is already positive
  bottomUp.constant = clippingBounds.z + scaledClippingOffset; //clipping positive since we want to move (increase) the clipping to the bottom

  //already negative since the left offset is already negative
  leftToRight.constant = clippingBounds.w + scaledClippingOffset; //clipping positive since we want to move (reduce) the clipping to the left
}
