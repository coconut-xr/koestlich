import { Mesh, Object3D, Vector4 } from "three";
import { ContainerState } from "./components/index.js";
import { saveDivideNumber, saveDivideScalar } from "./utils.js";
import { BackgroundMaterial } from "./index.js";
import { InstanceOf } from "@coconut-xr/xmaterials";

export function linkBackground(
  current: ContainerState,
  object: Object3D,
  material: InstanceOf<typeof BackgroundMaterial>,
): void {
  object.position.copy(current.translate);
  current.translate = object.position;

  object.scale.copy(current.scale);
  current.scale = object.scale;

  material.borderColor.copy(current.borderColor);
  current.borderColor = material.borderColor;
}

const _0_5 = new Vector4(0.5, 0.5, 0.5, 0.5);

export function updateBackgroundValues(
  current: ContainerState,
  mesh: Mesh,
  material: InstanceOf<typeof BackgroundMaterial>,
): void {
  material.opacity = current.backgroundOpacity.x;
  material.color.setRGB(
    current.backgroundColor.x,
    current.backgroundColor.y,
    current.backgroundColor.z,
  );
  mesh.visible = current.borderOpacity.x > 0.001 || current.backgroundOpacity.x > 0.001;
  material.borderOpacity = current.borderOpacity.x;
  material.borderBend = current.borderBend.x;
  material.ratio = saveDivideNumber(current.scale.x, current.scale.y);
  saveDivideScalar(material.borderRadius.copy(current.borderRadius), current.scale.y).min(_0_5);
  saveDivideScalar(material.borderSize.copy(current.borderSize), current.scale.y);
}
