# Getting Started

In the following tutorials, we will create several UIs using **koestlich** and react-three/fiber. Install the dependencies manually via `npm i @coconut-xr/koestlich @react-three/fiber react react-dom three` or use the CodeSandbox provided for each example.

## First Layout

At first, we will create 3 containers. One container is the root node with a size of 2 by 1 three.js untits, expressed by `RootContainer`. The `RootContainer` has a horizontal (row) flex-direction, while the children expressed by `Container` equally fill its width with a margin between them.

[CodeSandbox](https://codesandbox.io/s/koestlich-first-layout-owgw9d?file=/src/app.tsx)

![Screenshot](./first-layout.png)

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RootContainer, Container } from "@coconut-xr/koestlich";

export default function App() {
  return (
    <Canvas>
      <OrbitControls />
      <RootContainer backgroundColor="red" sizeX={2} sizeY={1} flexDirection="row">
        <Container flexGrow={1} margin={48} backgroundColor="green" />
        <Container flexGrow={1} margin={48} backgroundColor="blue" />
      </RootContainer>
    </Canvas>
  );
}
```

## Scaling & Sizing

**TLDR**: Use the optional paramters `sizeX` and `sizeY` to define a specific size of the UI in three.js units. Use `pixelSize` to scale the pixels units of the UI instead of increasing the size of the individual elements (normal text should have a default size of `16px` like in the web).

<details>
  <summary>In Depth Explanation</summary>

  The size of the root element is specified in three.js units using the optional `sizeX` and `sizeY` parameters.
  
  Declaring the size of elements inside the root element using parameters, such as the `width` of an image or the `fontSize` of a text element, is based on `pixel` units, which strongly relate to the `px` unit in css. The relation between three.js units and pixel units can be set using the `pixelSize` property. The property expresses the size of one pixel in three.js units and defaults to `0.002`. With this default, `500px` is equal to 1 three.js unit. To make interoperability between code bases and different component libraries easier, we encourage to use the intuition of pixel sizes from the web. For instance, the default text height relates to 16 pixels. If these pixel sizes appear too small or too high in the szene, the `pixelSize` should be increased or decreased respectively.
  
  Another property exposed by the `RootContainer` is the `precision`, which expresses the resolution of the units. For instance, the default `precision` of `0.1` allows the layout engine to interprete the values `0.5` and `0.4` correctly but will misinterprete `0.45`. Additionall,y the precision influeces the z-offset between nested components. If z-fighting occurs the precision should be increased.
</details>

## Asynchronous Content

**Koestlich** provides Text, Image, GLTF, and SVG components, which load their content asynchronously. The components use the Suspense API from react to handle the loading state. This allows the components to be wrapped in a Suspense component to display a fallback element while loading.

The asynchronous loading can lead to inconsistent ordering. **Koestlich** can enforce a specific order of components by setting the `index` parameter.

The `index` parameter can also be used to reorder elements independent of how they are expressed in react.

[CodeSandbox](https://codesandbox.io/s/koestlich-async-content-1fyyhw?file=/src/app.tsx)

![Screenshot](./async-content.png)

```tsx
import { RootContainer, Container, Image } from "@coconut-xr/koestlich";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

export default function App() {
  return (
    <Canvas>
      <OrbitControls />
      <RootContainer backgroundColor="red" sizeX={2} sizeY={1} flexDirection="row">
        <Container index={0} flexGrow={1} margin={48} backgroundColor="green" />
        <Suspense>
          <Image index={1} flexBasis={0} flexGrow={1} margin={48} url="example.png" />
        </Suspense>
      </RootContainer>
    </Canvas>
  );
}
```

## Text

The Text component enables rendering text using multi-channel signed distance functions (MSDF). A font can be created from a .ttf file to an MSDF representation as a JSON and a corresponding texture using [`msdf-bmfont-xml`](https://www.npmjs.com/package/msdf-bmfont-xml). We provide a set of precompiled MSDF fonts from [here](https://github.com/coconut-xr/msdf-fonts). In the following, a Text is rendered with the Roboto font family.

[CodeSandbox](https://codesandbox.io/s/koestlich-text-b8ymnm?file=/src/app.tsx)

![Screenshot](./text.png)

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RootContainer, Container, Text } from "@coconut-xr/koestlich";
import { Suspense } from "react";

export default function App() {
  return (
    <Canvas>
      <OrbitControls />
      <RootContainer backgroundColor="red" sizeX={2} sizeY={1} flexDirection="row">
        <Container index={0} flexGrow={1} margin={48} backgroundColor="green" />
        <Suspense>
          <Text fontSize={64} index={1} margin={48} marginLeft={0}>
            Coconut XR
          </Text>
        </Suspense>
      </RootContainer>
    </Canvas>
  );
}
```

Via the `FontFamilyProvider`, additional MSDF fonts can be added.

```tsx
<FontFamilyProvider
  fontFamilies={{
    otherFont: ["<baseUrl>", "<pathToJson>"],
  }}
  defaultFontFamily="otherFont"
></FontFamilyProvider>
```

For text fields and text areas, we provide the [@coconut-xr/input](https://github.com/coconut-xr/input) library.

[CodeSandbox](https://codesandbox.io/s/koestlich-input-example-4ubrt0?file=/src/app.tsx)

![Screenshot](./text.gif)

## Animations

Animations are built into **koestlich** and work out of the box. Almost all properties can be animated. In contrast to HTML/CSS, elements can transition from one place in a layout to another, a feature often referred to as AutoTransition. To declare how UI elements relate between two different layouts, the `id` property is used. Placing the same `id` property on two UI components in different layouts will keep the underlying UI element alive and automatically transition. However, both UI components need to have the same type. Therefore, it is impossible to transition an Image to a Text component.
All Koestlich components have the `animation` property, which can either be set to one of the default animations (`noAnimation`, `distanceFadeAnimation` - default) or can be set to a custom animation.

The following example shows how the state is controlled via a button, which changes the ordering of components via the index parameter and animates the button's color between green and red.

[CodeSandbox](https://codesandbox.io/s/koestlich-animations-gnthy9?file=/src/app.tsx)

![Screenshot](./animations.gif)

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RootContainer, Container, Image } from "@coconut-xr/koestlich";
import { Suspense, useState } from "react";

export default function App() {
  const [state, setState] = useState(true);
  return (
    <Canvas>
      <OrbitControls />
      <RootContainer backgroundColor="black" sizeX={2} sizeY={1} flexDirection="row">
        <Container
          index={0}
          id="btn"
          onClick={() => setState(!state)}
          flexGrow={state ? 2 : 1}
          margin={48}
          backgroundColor={state ? "green" : "red"}
        />
        <Suspense>
          <Image
            index={state ? -1 : 1}
            id="img"
            flexBasis={0}
            flexGrow={1}
            margin={48}
            url="example.png"
          />
        </Suspense>
      </RootContainer>
    </Canvas>
  );
}
```

## 3D Content

The previous examples showed 2D elements positioned in the x/y plane. Integrating 3D geometries into the UI will make use of the z-Axis. In addition to having width and height, all components now have depth, which is their size on the z-Axis. All UI elements will be placed in front of their parent along the z-Axis.

![Three.js Coordinate System](https://mayaposch.files.wordpress.com/2012/12/opengl_coordinate_system.png)

[<small>Image Source</small>](https://mayaposch.wordpress.com/2012/12/17/on-the-coordinate-system-of-qgraphicsscene-in-qt/opengl_coordinate_system/)

**Koestlich** supports any Three.js geometry and material. The following example shows how to use the `GLTF` component to import a 3D model directly and how to use the `Object` component to insert an object with a `SphereGeomerty` and a `MeshPhongMaterial` into the layout.

[CodeSandbox](https://codesandbox.io/s/koestlich-3d-content-153ljq?file=/src/app.tsx)

![Screenshot](./3d-content.png)

```tsx
import { RootContainer, Object, GLTF, Container } from "@coconut-xr/koestlich";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { Mesh, MeshPhongMaterial, SphereBufferGeometry } from "three";

export default function App() {
  const sphere = useMemo(
    () =>
      new Mesh(
        new SphereBufferGeometry(),
        new MeshPhongMaterial({ toneMapped: false, color: "blue" }),
      ),
    [],
  );

  return (
    <Canvas>
      <directionalLight position={[1, 1, 1]} intensity={2} />
      <ambientLight intensity={0.1} />
      <OrbitControls />
      <RootContainer
        backgroundColor="red"
        sizeX={3}
        sizeY={1}
        borderRadius={48}
        flexDirection="row"
        overflow="hidden"
        justifyContent="space-evenly"
        padding={32}
      >
        <Object aspectRatio={1} index={0} object={sphere} padding={96}>
          <Container flexGrow={1} backgroundColor="green" />
        </Object>
        <Suspense>
          <GLTF index={1} url="Avocado.glb" />
        </Suspense>
      </RootContainer>
    </Canvas>
  );
}
```

Our example dashboard interface can be built using `ExtrudeGeometry` from three.js and the SVGs from any icon library. However, we use the `SVGLoader` code from the three.js/examples, which has limited features.

[CodeSandbox](https://codesandbox.io/s/koestlich-rounded-box-svg-1r3myd?file=/src/app.tsx)
![Screenshot](./roundedbox-svg.png)

```tsx
import { RootContainer, Object, SVG } from "@coconut-xr/koestlich";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ExtrudeGeometry, Shape, Mesh, MeshPhongMaterial } from "three";
import { Suspense, useMemo } from "react";

export default function App() {
  const mesh1 = useMemo(() => new Mesh(new CardGeometry(1, 1, 0.1),new MeshPhongMaterial({
      toneMapped: false,
      transparent: true
    })), []);
  const mesh2 = useMemo(() => new Mesh(new CardGeometry(1, 1, 0.1),new MeshPhongMaterial({
      toneMapped: false,
      transparent: true
    })), []);
  const mesh3 = useMemo(() => new Mesh(new CardGeometry(1, 1, 0.1),new MeshPhongMaterial({
      toneMapped: false,
      transparent: true
    })), []);
  return (
    <Canvas>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <directionalLight intensity={0.8} position={[1, 1, 1]} />
      <RootContainer
        backgroundColor="black"
        sizeX={2}
        sizeY={1}
        flexDirection="row"
      >
        <Object
          depth={48}
          object={mesh1}
          {...}
        >
          <Suspense>
            <SVG url="bank.svg" flexShrink={1} />
          </Suspense>
        </Object>
        <Object
          depth={48}
          object={mesh2}
          {...}
        >
          <Suspense>
            <SVG url="message.svg" flexShrink={1} />
          </Suspense>
        </Object>
        <Object
          depth={48}
          object={mesh3}
          {...}
        >
          <Suspense>
            <SVG url="clock.svg" flexShrink={1} />
          </Suspense>
        </Object>
      </RootContainer>
    </Canvas>
  );
}

class CardGeometry extends ExtrudeGeometry {
  constructor(width: number, height: number, radius: number) {
    const roundedRectShape = new Shape();
    roundedRectShape.moveTo(0, radius);
    roundedRectShape.lineTo(0, height - radius);
    roundedRectShape.quadraticCurveTo(0, height, radius, height);
    roundedRectShape.lineTo(width - radius, height);
    roundedRectShape.quadraticCurveTo(width, height, width, height - radius);
    roundedRectShape.lineTo(width, radius);
    roundedRectShape.quadraticCurveTo(width, 0, width - radius, 0);
    roundedRectShape.lineTo(radius, 0);
    roundedRectShape.quadraticCurveTo(0, 0, 0, radius);
    super(roundedRectShape, { depth: 1, bevelEnabled: false });
  }
}
```

## Overflow, Scroll, and Clipping

**Koestlich** handles clipping and scrolling for you. You only need to specify `overflow` "scroll" or "hidden" on any container. First, however, we need to configure react-three/fiber to support visual clipping and clipping of events, which is done via `<Canvas events={clippingEvents} gl={{ localClippingEnabled: true }}>`.

#### Important:

All components are animated by default using the `distanceFadeAnimation`. For a snappy scroll experience, the animation can be disabled by providing the `noAnimation` animation on the direct children of the scroll container.

The following example shows a scrollable user interface using the `noAnimation` property to deliver a snappy scroll experience.

[CodeSandbox](https://codesandbox.io/s/koestlich-overflow-c9nkvc?file=/src/app.tsx)

![Screenshot](./scroll.gif)

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RootContainer, Container, clippingEvents, noAnimation } from "@coconut-xr/koestlich";

export default function App() {
  return (
    <Canvas events={clippingEvents} gl={{ localClippingEnabled: true }}>
      <OrbitControls enableRotate={false} />
      <RootContainer
        backgroundColor="red"
        sizeX={2}
        sizeY={1}
        flexDirection="row"
        overflow="scroll"
      >
        <Container animation={noAnimation}>
          <Container width={750} margin={48} backgroundColor="green" />
          <Container width={750} margin={48} backgroundColor="blue" />
        </Container>
      </RootContainer>
    </Canvas>
  );
}
```

## Custom Materials

**Koestlich** allows to provide custom materials for the background on the `Text`, `Container`, and `Image` components. Using the library `@coconut-xr/xmaterials`, a new material can be built based on the existing three materials. Every provided material must be at least be a border material created through `makeBorderMaterial`. The `makeBorderMaterial` allows to provide default properties to the material. In the following example, we are creating a text element with a material based on the phong material with high specular and shininess. Using the border properties, we can create a border that creates the illusion of a 3d mesh. Specifically, the `borderBend` property allows bending the normals on the border to create this effect efficiently. The `anchorX` and `anchorY` properties allow the button in the following example to have its origin in (0,0,0).

[CodeSandbox](https://codesandbox.io/s/koestlich-custom-materials-vchy5l?file=/src/app.tsx)

![Screenshot](./custom-materials.jpg)

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { clippingEvents, RootText } from "@coconut-xr/koestlich";
import { makeBorderMaterial } from "@coconut-xr/xmaterials";
import { MeshPhongMaterial } from "three";

const FancyMaterial = makeBorderMaterial(MeshPhongMaterial, {
  specular: 0x111111,
  shininess: 100,
});

export default function App() {
  return (
    <Canvas events={clippingEvents} gl={{ localClippingEnabled: true }}>
      <OrbitControls enableRotate={false} />
      <RootText
        backgroundColor="black"
        color="white"
        anchorX="center"
        anchorY="center"
        padding={24}
        borderRadius={32}
        fontSize={32}
        borderColor="black"
        borderBend={0.3}
        border={8}
        material={FancyMaterial}
      >
        I look fancy
      </RootText>
    </Canvas>
  );
}
```
