# Components

The **koestlich** components make the primitives from which more complex layout structures can be composed. All components share the default flexbox properties and event handlers. In addition, all components have properties for their individual functionality.

## Shared Properties

_All properties are optional. The defaults are set in the yoga flexbox implementation._

| Property       | Type                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| index          | number                                                                                                      |
| id             | number                                                                                                      |
| classes        | Array<Properties>                                                                                           |
| inset          | number, Percentage                                                                                          |
| padding        | number, Percentage                                                                                          |
| paddingX       | number, Percentage                                                                                          |
| paddingY       | number, Percentage                                                                                          |
| margin         | number, Percentage, "auto"                                                                                  |
| marginX        | number, Percentage, "auto"                                                                                  |
| marginY        | number, Percentage, "auto"                                                                                  |
| marginTop      | number, Percentage, "auto"                                                                                  |
| marginLeft     | number, Percentage, "auto"                                                                                  |
| marginRight    | number, Percentage, "auto"                                                                                  |
| marginBottom   | number, Percentage, "auto"                                                                                  |
| translateX     | number                                                                                                      |
| translateY     | number                                                                                                      |
| translateZ     | number                                                                                                      |
| scaleX         | number                                                                                                      |
| scaleY         | number                                                                                                      |
| scaleZ         | number                                                                                                      |
| positionType   | "absolute", "relative", "count"                                                                             |
| positionTop    | number, Percentage                                                                                          |
| positionLeft   | number, Percentage                                                                                          |
| positionRight  | number, Percentage                                                                                          |
| positionBottom | number, Percentage                                                                                          |
| alignContent   | "count", "space-around", "space-between", "baseline", "stretch", "flex-end", "center", "flex-start", "auto" |
| alignItems     | "count", "space-around", "space-between", "baseline", "stretch", "flex-end", "center", "flex-start", "auto" |
| alignSelf      | "count", "space-around", "space-between", "baseline", "stretch", "flex-end", "center", "flex-start", "auto" |
| flexDirection  | "count", "row-reverse", "row", "column-reverse", "column"                                                   |
| flexWrap       | "count", "wrap-reverse", "wrap", "no-wrap"                                                                  |
| justifyContent | "count", "space-around", "space-between", "flex-end", "center", "flex-start", "space-evenly"                |
| flexBasis      | number, Percentage                                                                                          |
| flexGrow       | number                                                                                                      |
| flexShrink     | number                                                                                                      |
| width          | number, Percentage, "auto"                                                                                  |
| height         | number, Percentage, "auto"                                                                                  |
| minWidth       | number, Percentage                                                                                          |
| minHeight      | number, Percentage                                                                                          |
| maxWidth       | number, Percentage                                                                                          |
| maxHeight      | number, Percentage                                                                                          |
| aspectRatio    | number                                                                                                      |
| borderTop      | number                                                                                                      |
| borderLeft     | number                                                                                                      |
| borderRight    | number                                                                                                      |
| borderBottom   | number                                                                                                      |
| overflow       | "visible", "count", "scroll", "hidden"                                                                      |
| paddingTop     | number, Percentage                                                                                          |
| paddingLeft    | number, Percentage                                                                                          |
| paddingRight   | number, Percentage                                                                                          |
| paddingBottom  | number, Percentage                                                                                          |

_Event Properties_

| Property        | Type                                      |
| --------------- | ----------------------------------------- |
| onWheel         | (event: ThreeEvent<WheelEvent>) => void   |
| onPointerUp     | (event: ThreeEvent<PointerEvent>) => void |
| onPointerOver   | (event: ThreeEvent<PointerEvent>) => void |
| onPointerOut    | (event: ThreeEvent<PointerEvent>) => void |
| onPointerMove   | (event: ThreeEvent<PointerEvent>) => void |
| onPointerLeave  | (event: ThreeEvent<PointerEvent>) => void |
| onPointerEnter  | (event: ThreeEvent<PointerEvent>) => void |
| onPointerDown   | (event: ThreeEvent<PointerEvent>) => void |
| onPointerCancel | (event: ThreeEvent<PointerEvent>) => void |
| onDoubleClick   | (event: ThreeEvent<MouseEvent>) => void   |
| onContextMenu   | (event: ThreeEvent<MouseEvent>) => void   |
| onClick         | (event: ThreeEvent<MouseEvent>) => void   |

_Root Properties_
| Property | Type |
| --------------- | ----------------------------------------- |
| precision | number |
| loadYoga | function to load yoga |
| anchorX | "left" , "center" , "right" |
| anchorY | "top", "center", "bottom" |
| sizeX | number - size of the container in three.js units |
| sizeY | number - size of the container in three.js units|
| pixelSize | number - size of one pixel in relation to three.js units |
| position | Vector3 |
| rotation | Euler |

## Object

Renders any Three.js 3d Mesh.

| Parameter | Description                                                                                                                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| object    | The Three.js mesh to be rendered.                                                                                                                                                                                      |
| depth     | The depth property sets the size of the 3d Object along the z-Axis. Negative values are not possible. If no depth value is provided for a 3D model, the depth will be set according to the original width/depth ratio. |

## Container

The container renders a 2D plane with a special shader for borderRadius, borderSize, and borderColor in the background. The Image and Text component can also render a 2D plane with the same properties in the background.

| Property                | Type                |
| ----------------------- | ------------------- |
| borderRadiusTopLeft     | number              |
| borderRadiusTopRight    | number              |
| borderRadiusBottomRight | number              |
| borderRadiusBottomLeft  | number              |
| borderOpacity           | number              |
| borderColor             | ColorRepresentation |
| backgroundColor         | ColorRepresentation |
| backgroundOpacity       | number              |
| borderRadius            | number              |
| borderRadiusLeft        | number              |
| borderRadiusRight       | number              |
| borderRadiusTop         | number              |
| borderRadiusBottom      | number              |
| border                  | number              |
| borderX                 | number              |
| borderY                 | number              |
| borderBend              | number              |
| material                | Material class      |

## Image

The image renders a 2D plane with an image. The image also has the properties of the container to render a background.

| Parameter | Description                                                                                                                                                                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| url       | The url to the image.                                                                                                                                                                                                                                                                                                                        |
| fit       | The values can be "cover", "contain", or "fill". The fit property will only be effective if the element has a aspect ratio that differs from the image source aspect ratio. To force an image to a specific size that violate the aspect ratio of the image source, use the "maxWidth", "minWidth", "maxHeight", and "minHeight" properties. |

## Text

Renders a string into individual glyphs based on a multi-channel signed distance function. The text requires the provision of a FontFamilyProvider. The text also has the properties of the container to render a background.

| Parameter            | Description                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| fontFamily           | The name of the font family specified in the FontFamilyProvider. If none is provided, the default fontFamily from the font family provider is used    |
| fontSize             | The maximum height of the rendered glyphs. The default is 0.1.                                                                                        |
| letterSpacing        | The additional spacing between the letters/glyphs. The default is 0.                                                                                  |
| lineHeightMultiplier | The multiplier of the line height. Influences the spacing between lines. The default is 1.2.                                                          |
| wrapper              | The wrapping behavior for the text layouting. Values can be "breakall", "nowrap", "breakword", or a custom glyph wrapper. The default is "breakword". |
| horizontalAlign      | The horizontal alignment of the text. Values can be "left", "center", "right", or "block". The default is "left".                                     |
| verticalAlign        | The vertical alignment of the text. Values can be "top", "center", or "bottom".                                                                       |

## GLTF

The GLTF component renders a .gltf file into the 3D layout. All children are placed in front of the 3D model.

| Parameter | Description                                                                                                                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| url       | The url to the gltf.                                                                                                                                                                                                   |
| depth     | The depth property sets the size of the 3d Object along the z-Axis. Negative values are not possible. If no depth value is provided for a 3D model, the depth will be set according to the original width/depth ratio. |

## SVG

The SVG component renders a .svg file into the 3D layout.

| Parameter | Description                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| url       | The URL to the svg file.                                                                                                                         |
| depth     | The size of the rendered SVG in the z-Axis (yes SVGs are 3D Models). Negative values are not possible. A flat SVG can be rendered via depth={0}. |

## Box

The Box component renders a simple 3D box into the layout.

| Parameter | Description                                                             |
| --------- | ----------------------------------------------------------------------- |
| depth     | The size of the box along the z-Axis. Negative values are not possible. |
