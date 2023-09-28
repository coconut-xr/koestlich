import Image from '@theme/IdealImage';
import { CodesandboxEmbed } from '../CodesandboxEmbed.tsx'

# Asynchronous Content

**Koestlich** provides Text, Image, GLTF, and SVG components, which load their content asynchronously. The components use the Suspense API from react to handle the loading state. This allows the components to be wrapped in a Suspense component to display a fallback element while loading.

The asynchronous loading can lead to inconsistent ordering. **Koestlich** can enforce a specific order of components by setting the `index` parameter.

The `index` parameter can also be used to reorder elements independent of how they are expressed in react.

<CodesandboxEmbed path="koestlich-async-content-1fyyhw"/>

<Image img={require('@site/static/images/async-content.png')}/>

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
