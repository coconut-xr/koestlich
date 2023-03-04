# Getting Started

In the following tutorials, we will create several UIs using **koestlich** and react-three/fiber. Each example provides a CodeSandbox containg the code.

## First Layout

At first, we will create 3 containers. One container is the root node, expressed by `RootContainer`. The `RootContainer` has a row (horizontal) flex-direction, and the children equally fill its width while with padding between them. We need to load the yoga WASM code. It can be provided manually from `yoga-wasm-web` or simply importing a BASE64 version of the code from `@coconut-xr/flex`.

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RootContainer, Container } from "@coconut-xr/koestlich";
import { loadYoga } from "@coconut-xr/flex";

export default function Index() {
  return (
    <Canvas>
      <OrbitControls />
      <RootContainer
        loadYoga={loadYoga}
        backgroundColor="red"
        width={2}
        height={1}
        flexDirection="row"
      >
        <Container flexGrow={1} padding={0.1} backgroundColor="green" />
        <Container flexGrow={1} padding={0.1} backgroundColor="blue" />
      </RootContainer>
    </Canvas>
  );
}
```

## Asynchronous Content

Some content in layouts needs to be asynchronously fetched from the network. **Koestlich** has the components Text, Image, GLTF, and SVG, which load its content asynchronously. The components use the Suspense API from react and can be wrapped in a Suspense component to display a fallback element while loading.

The asynchronous loading can lead to inconsistent ordering. To enforce a specific ordering, we recommend setting the `index` parameter and thus declaring a consistent order.

The `index` parameter can also be used to reorder elements independent of how they are expressed in react.

```tsx
import { Canvas } from "";
import { OrbitControls } from "";
import { RootContainer, Container, Image } from "@coconut-xr/koestlich";

export default function Index() {
  return (
    <Canvas>
      <OrbitControls />
      <RootContainer backgroundColor="red" width={2} height={1} flexDirection="row">
        <Container index={0} flexGrow={1} padding={0.1} backgroundColor="green" />
        <Suspense>
          <Image index={1} flexGrow={1} padding={0.1} url="example.png" />
        </Suspense>
      </RootContainer>
    </Canvas>
  );
}
```

## Text

The Text component enables rendering text using multi-channel signed distance functions (MSDF). A font can be rendered by compiling a .ttf file to an MSDF representation as a JSON and a corresponding texture. We provide a set of precompiled MSDF representations. In the following, a Text is rendered with the Roboto font family.

```tsx
import { Canvas } from "";
import { OrbitControls } from "";
import { RootContainer, Container, Image } from "@coconut-xr/koestlich";

export default function Index() {
  return (
    <Canvas>
      <OrbitControls />
        <RootContainer backgroundColor="red" width={2} height={1} flexDirection="row">
          <Container index={0} flexGrow={1} padding={0.1} backgroundColor="green" />
          <Suspense>
            <Text index={1} flexGrow={1} padding={0.1} url="example.png" />
          </Suspense>
      </FontFamilyProvider>
    </Canvas>
  );
}
```

Via the `FontFamilyProvider` additional MSDF fonts can be added.

```tsx
<FontFamilyProvider
  fontFamilies={{
    otherFont: ["<baseUrl>", "<pathToJson>"]
  }}
  defaultFontFamily="otherFont"
></FontFamilyProvider>
```

## Animations

Animations are built into **koestlich**, and they work out of the box. The animation behavior of every component can be controlled via the animation property, which allows controlling the animation computation and the birth and death animations. The default behavior is fade in and out by opacity and a distance-based animation computation. The following example shows how the state is controlled via a button, which triggers an image to be faded in and out and the button to animate between red and green.

```tsx
import { Canvas } from "";
import { OrbitControls } from "";
import { RootContainer, Container, Image } from "@coconut-xr/koestlich";
import { Suspense, useState } from "react";

export default function Index() {
  const [state, setState] = useState(true);
  return (
    <Canvas>
      <OrbitControls />
      <RootContainer backgroundColor="red" width={2} height={1} flexDirection="row">
        <Container
          index={0}
          id="btn"
          onClick={() => setState(!state)}
          flexGrow={1}
          padding={0.1}
          backgroundColor={state ? "green" : "red"}
        />
        {state && (
          <Suspense>
            <Image index={1} id="img" flexGrow={1} padding={0.1} url="example.png" />
          </Suspense>
        )}
      </RootContainer>
    </Canvas>
  );
}
```

## Overflow, Scroll, and Clipping

**Koestlich** handles clipping and scrolling for you. You only need to specify overflow "scroll" or "hidden" on any container. First, however, we need to configure react-three/fiber to support visual clipping and clipping of events.

```tsx
import { Canvas } from "";
import { OrbitControls } from "";
import { RootContainer, Container, clippingEvents } from "@coconut-xr/koestlich";

export default function Index() {
  <Canvas events={clippingEvents} gl={{ localClippingEnabled: true }}>
    <OrbitControls />
    <RootContainer overflow="scroll" backgroundColor="red" width={2} height={1} flexDirection="row">
      <Container width={1.5} padding={0.1} backgroundColor="green" />
      <Container width={1.5} padding={0.1} backgroundColor="blue" />
    </RootContainer>
  </Canvas>;
}
```
