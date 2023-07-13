import {
  applyGlyphBuilder,
  Bounds,
  BreakallWrapper,
  calculateSpaceConversionRatio,
  GlyphProperties,
  GlyphStructureBuilder,
  GlyphWrapper,
  InstancedGlypthMaterial,
  InstancedGlypthMesh,
  measureGlyphDependencies,
  measureGlyph,
  NowrapWrapper,
  updateGlyphMesh,
  Font,
  WordWrapper,
} from "@coconut-xr/glyph";
import {
  createContext,
  default as React,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
} from "react";
import {
  BufferAttribute,
  Color,
  ColorRepresentation,
  Material,
  Mesh,
  Plane,
  PlaneGeometry,
  Texture,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import { linkBackground, updateBackgroundValues } from "../background.js";
import { buildComponent } from "../component.js";
import { applyEventHandlers } from "../events.js";
import { BaseNode } from "../node.js";
import { flexAPI } from "../properties/index.js";
import { buildRoot } from "../root.js";
import { saveDivide, saveDivideScalar } from "../utils.js";
import { Vector1 } from "../vector.js";
import {
  ContainerProperties,
  ContainerState,
  updateContainerProperties,
  updateEventProperties,
} from "./container.js";
import { useThree } from "@react-three/fiber";
import { suspend } from "suspend-react";
import { loadFont } from "@coconut-xr/glyph";
import { setMeasureFunc, YogaProperties } from "@coconut-xr/flex";
import { MeasureFunction } from "yoga-wasm-web";
import { BackgroundMaterial, PlatformConstants, containerDefaults } from "../index.js";
import { Constructor, InstanceOf } from "@coconut-xr/xmaterials";

const geometry = new PlaneGeometry();
geometry.translate(0.5, -0.5, 0);
const position = geometry.getAttribute("position");
const array = new Float32Array((4 * position.array.length) / position.itemSize);
const tangent = [1, 0, 0, 1];
for (let i = 0; i < array.length; i++) {
  array[i] = tangent[i % 4];
}
geometry.setAttribute("tangent", new BufferAttribute(array, 4));

const lineBounds = new Bounds();

export type TextState = {
  opacity: Vector1;
  color: Vector3;
  contentOffset: Vector2;
} & ContainerState;

//values are used for the render-order-offset and the z-offset
const selectionOffset = 0.5;
const textOffset = 1;
//more than 1 is okay, since the next layer starts at 2
const caretOffset = 1.5;

export class TextNode extends BaseNode<TextState> {
  public target: Readonly<TextState> = {
    color: new Vector3(),
    opacity: new Vector1(),
    backgroundColor: new Vector3(),
    backgroundOpacity: new Vector1(),
    translate: new Vector3(),
    scale: new Vector3(),
    contentOffset: new Vector2(),
    borderColor: new Vector3(),
    borderOpacity: new Vector1(),
    borderRadius: new Vector4(),
    borderSize: new Vector4(),
    borderBend: new Vector1(),
  };

  private mesh: InstancedGlypthMesh | undefined;
  private material: InstancedGlypthMaterial | undefined;
  private structureBuilder = new GlyphStructureBuilder();
  public glyphProperties: GlyphProperties | undefined;
  public text: string | undefined;
  protected hasFocus = false;

  private globalContentScale = new Vector2();
  private globalOuterScale = new Vector2();

  private hasStructuralChanges = false;
  private hasTransformationChanges = false;

  private backgroundMaterial?: InstanceOf<typeof BackgroundMaterial>;
  protected backgroundMesh = new Mesh(geometry);

  private caretMaterial = new BackgroundMaterial({
    transparent: true,
    toneMapped: false,
    opacity: 0.5,
  });
  private caretMesh = new Mesh(geometry, this.caretMaterial);

  private selectionMaterial = new BackgroundMaterial({
    transparent: true,
    toneMapped: false,
    opacity: 0.5,
  });
  private selectionMeshCache: Mesh[] = [];
  private _selection?: [number, number];
  get selection(): [number, number] | null {
    return this._selection ?? null;
  }
  get caretPosition(): number | null {
    return this.selection == null || this.selection[0] !== this.selection[1]
      ? null
      : this.selection[0];
  }

  setBackgroundMaterialClass(constructor: Constructor<Material>) {
    if ((this.backgroundMaterial instanceof constructor) as any) {
      //already set
      return;
    }

    const backgroundMaterial = new constructor({
      transparent: true,
      toneMapped: false,
    }) as InstanceOf<typeof BackgroundMaterial>;
    this.backgroundMesh.material = backgroundMaterial;
    this.backgroundMaterial?.dispose();
    this.backgroundMaterial = backgroundMaterial;

    if (this.current != null) {
      this.linkCurrent(this.current);
      this.backgroundMaterial.clippingPlanes = this.clippingPlanes;
      this.backgroundMaterial.needsUpdate = true;
    }
  }

  applyClippingPlanes(planes: Plane[] | null): void {
    if (this.backgroundMaterial != null) {
      this.backgroundMaterial.clippingPlanes = planes;
      this.backgroundMaterial.needsUpdate = true;
    }

    this.caretMaterial.clippingPlanes = planes;
    this.caretMaterial.needsUpdate = true;

    this.selectionMaterial.clippingPlanes = planes;
    this.selectionMaterial.needsUpdate = true;

    if (this.material != null) {
      this.material.clippingPlanes = planes;
      this.material.needsUpdate = true;
    }
  }

  linkCurrent(current: TextState): void {
    //link global transformation directly (more efficiently then in onUpdate)
    if (this.backgroundMaterial == null) {
      return;
    }
    linkBackground(current, this.backgroundMesh, this.backgroundMaterial);
  }

  onInit() {
    this.bucket.add(this.backgroundMesh);
    this.bucket.add(this.caretMesh);
    applyEventHandlers(this.backgroundMesh, this, this.root);
  }

  updateGlyphProperties(
    text: string,
    properties: GlyphProperties,
    hasStructuralChanges: boolean,
  ): void {
    this.text = text;
    //since we edit it with availableWidth & availableHeight later
    this.glyphProperties = Object.assign(this.glyphProperties ?? {}, properties);

    if (hasStructuralChanges) {
      this.hasStructuralChanges = true;
      return; //we return here since structural changes imply that there will be a rerender which causes onLayout which again triggers updateGlyphs()
    }

    this.updateGlyphs();
  }

  private updateGlyphs(): void {
    if (this.glyphProperties == null || this.text == null) {
      //missing data to compute glyphs
      return;
    }

    this.glyphProperties.availableWidth = this.globalContentScale.x;
    this.glyphProperties.availableHeight = this.globalContentScale.y;

    //update material
    if (this.material == null) {
      const material = new InstancedGlypthMaterial(this.glyphProperties.font, {
        transparent: true,
        clippingPlanes: this.clippingPlanes as any,
      });
      material.toneMapped = false;
      material.transparent = true;
      this.material = material;
    } else {
      this.material.updateFont(this.glyphProperties.font);
    }

    //update glyph structure
    if (this.hasStructuralChanges) {
      applyGlyphBuilder(this.structureBuilder, this.text, this.glyphProperties);
      this.hasStructuralChanges = false;
      this.hasTransformationChanges = true;
    }

    if (this.mesh != null && !this.hasTransformationChanges) {
      return;
    }

    //update mesh
    const mesh = updateGlyphMesh(
      this.mesh,
      this.structureBuilder,
      this.material,
      this.glyphProperties,
    );
    this.hasTransformationChanges = false;

    if (mesh == this.mesh) {
      return;
    }

    if (this.mesh != null) {
      this.bucket.remove(this.mesh);
      this.mesh.dispose();
    }

    this.mesh = mesh;
    this.bucket.add(this.mesh);
  }

  onLayout(): void {
    const contentWidth =
      this.measuredGlobalScale.x -
      this.target.borderSize.y - //right
      this.target.borderSize.w - //left
      this.measuredGlobalPadding.y - //right
      this.measuredGlobalPadding.w; //left
    const contentHeight =
      this.measuredGlobalScale.y -
      this.target.borderSize.x - //top
      this.target.borderSize.z - //bottom
      this.measuredGlobalPadding.x - //top
      this.measuredGlobalPadding.z; //bottom

    this.globalContentScale.set(contentWidth, contentHeight);
    this.globalOuterScale.set(this.target.scale.x ?? 1, this.target.scale.y ?? 1);
    saveDivide(
      this.target.contentOffset.set(
        this.measuredGlobalPadding.w + this.target.borderSize.w, //left
        -this.measuredGlobalPadding.x - this.target.borderSize.x, //top
      ),
      this.measuredGlobalScale,
    );

    if (
      this.glyphProperties?.availableWidth != contentWidth ||
      this.glyphProperties.availableHeight != contentHeight
    ) {
      this.hasStructuralChanges = true;
    }

    this.updateGlyphs();
  }

  onUpdate(current: TextState): void {
    if (this.backgroundMaterial != null) {
      updateBackgroundValues(current, this.backgroundMesh, this.backgroundMaterial);
    }

    if (this.material != null) {
      this.material.opacity = current.opacity.x;
      this.material.color.setRGB(current.color.x, current.color.y, current.color.z);
    }

    this.caretMaterial.color.setRGB(current.color.x, current.color.y, current.color.z);
    this.updateCaretTransformation(current);

    this.selectionMaterial.color.setRGB(current.color.x, current.color.y, current.color.z);
    this.updateSelectionTransformation(current);

    if (this.mesh != null) {
      this.mesh.visible = current.opacity.x > 0.001;
      this.mesh.position
        .set(current.contentOffset.x, current.contentOffset.y, textOffset) //the "textOffset" offset in z gets scaled with the depth which is minimal
        .multiply(current.scale)
        .add(current.translate);
      //divide through target contentScale & scale since the mesh acutally needs no scaling since the glyphs are positioned automatically

      saveDivideScalar(this.mesh.scale.set(1, 1, 1), this.globalOuterScale.y).multiplyScalar(
        current.scale.y,
      );
    }
  }

  onCleanup(): void {
    this.bucket.remove(this.backgroundMesh);
    this.bucket.remove(this.caretMesh);
    this.clearSelectionMesh();

    if (this.mesh != null) {
      this.bucket.remove(this.mesh);
      this.mesh.dispose();
    }

    this.caretMaterial.dispose();
    this.material?.dispose();
    this.selectionMaterial.dispose();
  }

  private updateCaretTransformation(current: TextState): void {
    const caretPosition = this.caretPosition;
    if (
      !this.text ||
      !this.glyphProperties ||
      !this.mesh ||
      !this.hasFocus ||
      caretPosition == null
    ) {
      this.caretMesh.visible = false;
      return;
    }

    this.caretMesh.visible = true;

    const idx = caretPosition;
    // initial position of the line? Used to hard set caret x position to 0
    let isLineFirstChar = idx === 0;
    let lineIdx = 0;
    const lineLastGlyphIndex = this.mesh.lineLastGlyphIndex ?? [];
    const isLastPos = idx === (lineLastGlyphIndex[lineLastGlyphIndex.length - 1] ?? 0) + 1;
    const lastChar = this.text?.slice(-1);
    // find the carets line and test if it is to be placed at first pos in the line.
    // Reverse iterating is just more convenient with less special cases necessary
    for (let i = lineLastGlyphIndex.length - 1; i >= 0; i--) {
      if (caretPosition > lineLastGlyphIndex[i]) {
        lineIdx = i + 1;
        isLineFirstChar =
          idx == 0 || (idx == lineLastGlyphIndex[i] + 1 && !(isLastPos && lastChar !== "\n"));
        break;
      }
    }

    // General positioning strategy: Position the cursor to the right
    // of the previous character.

    // the glyph index can deviate from the selected pos if the
    // caret is at the last possible position. We adjust for that.
    const glyphIdx = Math.min(idx, (this.text?.length ?? 0) - 1);

    let caretX: number;
    if (isLineFirstChar) {
      caretX = 0;
    } else if (isLastPos && lastChar !== "\n") {
      // caret ist at the last position but last character is not a newline
      // normally the caret would wrap to the next line at its initial position
      // but because the text does not en with a newline, we have to adjust the
      // line number to be the actual last line.
      lineIdx = Math.max(lineLastGlyphIndex.length - 1, 0);
      // move to right character position if caret is at the last position
      // and text does not end with a newline
      caretX = this.getXStartOfNextGlyph(glyphIdx, this.glyphProperties);
    } else {
      caretX = this.getXStartOfNextGlyph(glyphIdx - 1, this.glyphProperties);
    }

    const lineHeight = this.mesh.lineHeight;
    const caretY = this.mesh.bounds.y + -lineIdx * lineHeight;

    this.caretMesh.position
      .set(current.contentOffset.x, current.contentOffset.y, caretOffset) //the "caretOffset" offset in z gets scaled with the depth which is minimal
      .multiply(current.scale)
      .add(current.translate);

    const textScaleMultiplier =
      this.globalOuterScale.y == 0 ? 0 : current.scale.y / this.globalOuterScale.y;

    // write bounds info to mesh properties:

    //multiply with y scale since that represents the overall scale value of the text
    this.caretMesh.position.x += caretX * textScaleMultiplier;
    this.caretMesh.position.y += caretY * textScaleMultiplier;

    // scale the caretMesh. Height is allways the full line height, width is 3% of line height
    this.caretMesh.scale.set(lineHeight * 0.03, lineHeight, 1).multiplyScalar(textScaleMultiplier);
  }

  setSelection(selection: [number, number] | null): void {
    this._selection = selection ?? undefined;
  }

  private updateSelectionTransformation(current: TextState): void {
    if (!this.hasFocus || !this.text || !this.mesh) {
      this.selectionMaterial.opacity = 0;
      return;
    }

    this.selectionMaterial.opacity = 0.5;

    const sel = this._selection;
    if (sel == null || this.glyphProperties == null || sel[0] === sel[1]) {
      this.clearSelectionMesh();
      return;
    }
    const selInfos: { y: number; x: number; width: number; height: number }[] = [];
    const [selStart, selEnd] = sel;
    const lineLastGlyphIndex = this.mesh?.lineLastGlyphIndex ?? [];
    const spaceWidth = this.getGlyphWidth(" ", this.glyphProperties);
    for (let i = 0; i < lineLastGlyphIndex.length; i++) {
      const lastGlyphPos = lineLastGlyphIndex[i];
      const firstGlyphPos = i === 0 ? 0 : lineLastGlyphIndex[i - 1] + 1;
      // skip if start of selection is not yet reached.
      if (selStart > lastGlyphPos) {
        continue;
      }
      // break early if end of selection is reached
      if (selEnd <= firstGlyphPos) {
        break;
      }

      const isSelStartInLine = selStart > firstGlyphPos && selStart <= lastGlyphPos;
      this.mesh.getLineBounds(i, lineBounds);
      const selXStart = isSelStartInLine ? this.mesh.getGlyphStartX(selStart) : 0;
      let selXEnd =
        selEnd > lastGlyphPos
          ? lineBounds.x + lineBounds.width
          : this.getXStartOfNextGlyph(selEnd - 1, this.glyphProperties);
      if (selEnd > lastGlyphPos && this.text[lastGlyphPos] === "\n") {
        selXEnd += spaceWidth;
      }

      const width = selXEnd - selXStart;
      selInfos.push({ x: selXStart, y: lineBounds.y, width, height: lineBounds.height });
    }

    const meshes = this.getSelectionMeshes(selInfos.length);
    for (let i = 0; i < meshes.length; i++) {
      const selInfo = selInfos[i];
      const mesh = meshes[i];

      mesh.position
        .set(current.contentOffset.x, current.contentOffset.y, selectionOffset) //the "selectionOffset" offset in z gets scaled with the depth which is minimal
        .multiply(current.scale)
        .add(current.translate);

      const textScaleMultiplier =
        this.globalOuterScale.y == 0 ? 0 : current.scale.y / this.globalOuterScale.y;

      // write bounds info to mesh properties:

      //multiply with y scale since that represents the overall scale value of the text
      mesh.position.x += selInfo.x * textScaleMultiplier;
      mesh.position.y += selInfo.y * textScaleMultiplier;

      mesh.scale.set(selInfo.width, selInfo.height, 1).multiplyScalar(textScaleMultiplier);
    }
  }

  private getXStartOfNextGlyph(index: number, glyphProperties: GlyphProperties): number {
    const glyph = this.text?.[index];
    if (glyph == null || glyph == "") {
      return 0;
    }
    return (this.mesh?.getGlyphStartX(index) ?? 0) + this.getGlyphWidth(glyph, glyphProperties);
  }

  private getGlyphWidth(glyph: string, glyphProperties: GlyphProperties): number {
    const spaceConversionRatio = calculateSpaceConversionRatio(
      glyphProperties.font,
      glyphProperties.fontSize,
    );
    return (
      (glyphProperties.font.getGlyphInfo(glyph).xadvance + glyphProperties.letterSpacing) *
      spaceConversionRatio
    );
  }

  private getSelectionMeshes(count: number): Mesh[] {
    if (count > this.selectionMeshCache.length) {
      const newMeshes = Array.from(
        { length: count - this.selectionMeshCache.length },
        () => new Mesh(geometry, this.selectionMaterial),
      );
      this.bucket.add(...newMeshes);
      this.selectionMeshCache.splice(this.selectionMeshCache.length, 0, ...newMeshes);
    } else if (count === this.selectionMeshCache.length) {
      return this.selectionMeshCache;
    } else {
      this.bucket.remove(...this.selectionMeshCache.splice(count));
    }

    return this.selectionMeshCache;
  }

  private clearSelectionMesh() {
    this.getSelectionMeshes(0);
  }
}

const colorHelper = new Color();

export type InvertOptional<S> = {
  [Key in keyof S as undefined extends S[Key] ? Key : never]-?: S[Key] extends infer K | undefined
    ? K
    : never;
};

export const textDefaults: Omit<
  InvertOptional<TextProperties & { children: string | undefined }>,
  "fontFamily" | keyof ContainerProperties
> = {
  fontSize: 16,
  horizontalAlign: "left",
  letterSpacing: 0,
  lineHeightMultiplier: 1.2,
  verticalAlign: "top",
  children: "",
  color: 0x0,
  opacity: 1,
  wrapper: "breakword",
};

export type GlyphWrapperProperty = GlyphWrapper | "breakall" | "nowrap" | "breakword";

export type TextProperties = {
  color?: ColorRepresentation;
  opacity?: number;
  fontFamily?: string;
  wrapper?: GlyphWrapperProperty;
} & Partial<Omit<GlyphProperties, "wrapper" | "font" | "availableWidth" | "availableHeight">> &
  ContainerProperties;

export function resolveGlyphWrapper(property: GlyphWrapperProperty) {
  if (typeof property != "string") {
    return property;
  }
  switch (property) {
    case "breakall":
      return BreakallWrapper;
    case "breakword":
      return WordWrapper;
    case "nowrap":
      return NowrapWrapper;
  }
}

/**
 * maps font family name to [baseUrl, fileName]
 */
export type FontFamilies = { [Name in string]: [string, string] };
export type FontFamilyContext = {
  fontFamilies: FontFamilies;
  defaultFontFamily: string;
};

const fontFamilyContext = createContext<FontFamilyContext>(null as any);

export function FontFamilyProvider<F extends FontFamilies>({
  fontFamilies,
  defaultFontFamily,
  children,
}: PropsWithChildren<{ fontFamilies: F; defaultFontFamily: keyof F & string }>) {
  return (
    <fontFamilyContext.Provider
      value={useMemo(
        () => ({ defaultFontFamily, fontFamilies }),
        [defaultFontFamily, fontFamilies],
      )}
    >
      {children}
    </fontFamilyContext.Provider>
  );
}

const defaultFontFamilyContext: FontFamilyContext = {
  defaultFontFamily: "roboto",
  fontFamilies: {
    roboto: [`https://coconut-xr.github.io/msdf-fonts/`, `roboto.json`],
    sourceserifpro: [`https://coconut-xr.github.io/msdf-fonts/`, `sourceserifpro.json`],
    opensans: [`https://coconut-xr.github.io/msdf-fonts/`, `opensans.json`],
    montserrat: [`https://coconut-xr.github.io/msdf-fonts/`, `montserrat.json`],
    quicksand: [`https://coconut-xr.github.io/msdf-fonts/`, `quicksand.json`],
  },
};

/**
 * @param fontFamily if undefined maps to defaultFontFamily
 */
export function useFont(fontFamily?: string): Font<Texture> {
  const fontContext = useContext(fontFamilyContext) ?? defaultFontFamilyContext;
  const font = suspend(
    async (fontFamily, fontContext) => {
      const textureLoader = new PlatformConstants.TextureLoader();
      const loadFontTexture = textureLoader.loadAsync.bind(textureLoader);
      const [baseFontUrl, fontUrl] =
        fontContext.fontFamilies[fontFamily ?? fontContext.defaultFontFamily];
      const font = await loadFont(baseFontUrl, fontUrl, loadFontTexture);
      return font;
    },
    [fontFamily, fontContext],
  );
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    font.page.flipY = false;
    font.page.anisotropy = maxAnisotropy;
    gl.initTexture(font.page);
  }, [gl, font.page]);
  return font;
}

export function useText(
  node: TextNode,
  {
    color,
    opacity,
    fontFamily,
    letterSpacing,
    lineHeightMultiplier,
    fontSize,
    wrapper,
    horizontalAlign,
    verticalAlign,
    material,
    ...props
  }: TextProperties & YogaProperties,
  children: string | undefined,
): undefined {
  const font = useFont(fontFamily);

  const text = children ?? textDefaults["children"];

  const glyphProperties = useMemo<GlyphProperties>(
    () => ({
      letterSpacing: letterSpacing ?? textDefaults["letterSpacing"],
      lineHeightMultiplier: lineHeightMultiplier ?? textDefaults["lineHeightMultiplier"],
      fontSize: fontSize ?? textDefaults["fontSize"],
      wrapper: resolveGlyphWrapper(wrapper ?? textDefaults["wrapper"]),
      horizontalAlign: horizontalAlign ?? textDefaults["horizontalAlign"],
      verticalAlign: verticalAlign ?? textDefaults["verticalAlign"],
      font,
    }),
    [letterSpacing, lineHeightMultiplier, fontSize, wrapper, horizontalAlign, verticalAlign, font],
  );

  let structuralChanges = false;

  const measureGlyphFn = useMemo<MeasureFunction>(() => {
    structuralChanges = true;
    return (w, wMode, h, hMode) => measureGlyph(text, glyphProperties, w, h);
  }, [...measureGlyphDependencies(text, glyphProperties)]);

  useEffect(() => {
    setMeasureFunc(node.yoga, node.precision, measureGlyphFn);
    node["requestLayoutCalculation"]();
  }, [measureGlyphFn, node]);

  useEffect(() => {
    //update must happen in useEffect to respect the lifeclycles when reusing nodescolorHelper.set(color ?? textDefaults["color"])

    updateContainerProperties(node, props);
    updateEventProperties(node, props);

    colorHelper.set(color ?? textDefaults["color"]);
    node.target.color.set(colorHelper.r, colorHelper.g, colorHelper.b);
    node.target.opacity.set(opacity ?? textDefaults["opacity"]);

    node.setBackgroundMaterialClass(material ?? containerDefaults["material"]);

    node.updateGlyphProperties(text, glyphProperties, structuralChanges);
    node.setProperties(props);
  });

  return undefined;
}

export const Text = buildComponent(TextNode, useText, flexAPI);
export const RootText = buildRoot(TextNode, useText, flexAPI);
