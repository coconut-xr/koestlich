import Image from '@theme/IdealImage';
import { CodesandboxEmbed } from '../codesandboxEmbed.tsx'

# First Layout

At first, we will create 3 containers. One container is the root node with a size of 2 by 1 three.js untits, expressed by `RootContainer`. The `RootContainer` has a horizontal (row) flex-direction, while the children expressed by `Container` equally fill its width with a margin between them.

<CodesandboxEmbed path="koestlich-first-layout-owgw9d"/>

<Image img={require('@site/static/images/first-layout.png')}/>

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
