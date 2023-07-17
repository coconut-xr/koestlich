/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/no-unknown-property */
import { Suspense, useMemo, useRef, useState } from "react";
import {
  Image,
  Text,
  SVG,
  Container,
  useContainer,
  GLTF,
  ContainerNode,
  DefaultStyleProvider,
  buildComponent,
  flexAPI,
  Object,
  RootObject,
  RootContainer,
  RootText,
  KoestlichTestCanvas,
  noAnimation,
} from "@coconut-xr/koestlich";
import { Canvas, useFrame } from "@react-three/fiber";
import { Fullscreen } from "./fullscreen.js";
import { OrbitControls } from "@react-three/drei";
import { Group, Mesh, MeshPhongMaterial, MOUSE, PlaneGeometry } from "three";
import { RoundedBoxGeometry } from "three-stdlib/geometries/RoundedBoxGeometry.js";
import { makeBorderMaterial } from "@coconut-xr/xmaterials";
import { XWebPointers, noEvents } from "@coconut-xr/xinteraction/react";

const imageClass = {
  height: 0.3,
};

const customAPI = {
  ...flexAPI,
  variant: (target: any, value: "danger" | "success") => {
    target.backgroundColor = {
      danger: 0xff0000,
      success: 0x00ff00,
    }[value];
  },
}; //satisfies PropertyAPI

const CustomContainer = buildComponent(ContainerNode, useContainer, customAPI);

export default function Index() {
  const [show, setShow] = useState(true);
  const [red, setRed] = useState(true);

  const obj = useMemo(() => {
    const x = new Mesh(
      new RoundedBoxGeometry(0.2, 0.2, 0.05),
      new MeshPhongMaterial({
        toneMapped: false,
      }),
    );
    x.castShadow = true;
    return x;
  }, []);

  const bgObj = useMemo(() => {
    const x = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshPhongMaterial({
        toneMapped: false,
      }),
    );
    x.receiveShadow = true;
    return x;
  }, []);

  return (
    <>
      <button
        style={{ zIndex: 1, position: "absolute", right: 10, bottom: 10 }}
        onClick={() => setShow((show) => !show)}
      >
        toggle show
      </button>
      <Canvas
        events={noEvents}
        shadows
        dpr={window.devicePixelRatio}
        gl={{ localClippingEnabled: true }}
        style={{ height: "100vh" }}
      >
        <color attach="background" args={[0]} />
        <XWebPointers />
        <RotateUI />
        <AppleUI />
        <directionalLight
          shadow-mapSize={2048}
          castShadow
          intensity={0.5}
          position={[0.1, 0.1, 1]}
        />
        <ambientLight color={0xffffff} intensity={0.5} />
        <Fullscreen
          camera={(ratio) => (
            <OrbitControls
              target={[0.5 * ratio, -0.5, 0]}
              enableZoom={false}
              enablePan={false}
              enableRotate={false}
              minDistance={1}
              maxDistance={1}
              mouseButtons={{
                LEFT: MOUSE.RIGHT,
                MIDDLE: MOUSE.MIDDLE,
                RIGHT: MOUSE.LEFT,
              }}
            />
          )}
        >
          {(width, height) =>
            show ? (
              <>
                <group position={[0, 0, 0]}>
                  <RootContainer
                    padding={0.03}
                    id="root"
                    overflow="scroll"
                    anchorX="left"
                    anchorY="top"
                    pixelSize={1}
                    sizeX={width}
                    sizeY={height}
                  >
                    <Suspense>
                      <Text index={1} fontSize={0.05} color={"white"} id="lorem-ipsum">
                        "But I must explain to you how all this mistaken idea of denouncing pleasure
                        and praising pain was born and I will give you a complete account of the
                        system, and expound the actual teachings of the great explorer of the truth,
                        the master-builder of human happiness."
                      </Text>
                    </Suspense>
                  </RootContainer>
                </group>
                <group position={[0, 0, -1]}>
                  <RootObject
                    padding={50}
                    color="gray"
                    id="root"
                    object={bgObj}
                    overflow="scroll"
                    anchorX="left"
                    anchorY="top"
                    sizeX={width}
                    sizeY={height}
                  >
                    <Container animation={noAnimation}>
                      <DefaultStyleProvider>
                        <Suspense fallback={null}>
                          <Image index={1} id="image0" classes={[imageClass]} url="example.png">
                            <Text positionType="absolute" positionLeft={30} positionTop={30}>
                              I am outside of the picture
                            </Text>
                          </Image>
                        </Suspense>

                        <Object
                          object={obj}
                          width={200}
                          height={100}
                          index={1.5}
                          color={red ? "red" : "blue"}
                          id="rounded"
                          onClick={() => setRed((red) => !red)}
                        ></Object>

                        <Suspense fallback={null}>
                          <Image
                            borderRadius={50}
                            border={10}
                            borderColor="green"
                            index={2}
                            id="image1"
                            classes={[imageClass]}
                            url="example.png"
                          />
                        </Suspense>
                        <Suspense fallback={null}>
                          <Image
                            borderRadius={10}
                            border={10}
                            borderColor="red"
                            index={2.5}
                            id="image2"
                            width={100}
                            url="test.png"
                          />
                        </Suspense>

                        <Suspense fallback={null}>
                          <SVG id="svg1" index={3} url="example.svg" height={100} />
                          <SVG
                            id="svg2"
                            index={4}
                            color={0xffff00}
                            url="example.svg"
                            height={200}
                          />
                          <SVG id="svg3" index={4} url="mozilla.svg" height={200} />
                        </Suspense>
                        <CustomContainer
                          borderRadius={10}
                          padding={10}
                          index={5}
                          id="x"
                          variant="success"
                        >
                          <Suspense fallback={null}>
                            <Text
                              backgroundColor="red"
                              index={0}
                              padding={10}
                              paddingLeft={20}
                              color={0x0}
                              fontSize={32}
                              id="c-xr"
                            >
                              Coconut XR
                            </Text>
                          </Suspense>
                          <Suspense>
                            <Text index={1} color={0x0} id="lorem-ipsum">
                              "But I must explain to you how all this mistaken idea of denouncing
                              pleasure and praising pain was born and I will give you a complete
                              account of the system, and expound the actual teachings of the great
                              explorer of the truth, the master-builder of human happiness."
                            </Text>
                          </Suspense>
                        </CustomContainer>
                        <Container index={6}>
                          <Suspense fallback={null}>
                            <GLTF
                              scaleX={1}
                              scaleY={1}
                              alignItems="center"
                              justifyContent="center"
                              id="gltf"
                              url="example.glb"
                              width={200}
                              index={5}
                              height={200}
                            >
                              <Suspense fallback={null}>
                                <Text index={0} fontSize={8} id="text2" color={0x0}>
                                  COCONUT XR
                                </Text>
                              </Suspense>
                            </GLTF>
                          </Suspense>
                        </Container>
                      </DefaultStyleProvider>
                    </Container>
                  </RootObject>
                </group>
              </>
            ) : (
              <></>
            )
          }
        </Fullscreen>
      </Canvas>
      <KoestlichTestCanvas>
        <Text color="white">Sample Text</Text>
      </KoestlichTestCanvas>
    </>
  );
}

const FancyMaterial = makeBorderMaterial(MeshPhongMaterial, {
  specular: 0x111111,
  shininess: 100,
});

function AppleUI() {
  return (
    <group position={[1, -0.5, 0]}>
      <RootText
        backgroundColor="black"
        color="white"
        anchorX="center"
        anchorY="center"
        padding={16}
        paddingLeft={undefined}
        id="root"
        borderRadius={16}
        borderColor="black"
        borderBend={0.3}
        border={4}
        material={FancyMaterial}
      >
        I look fancy
      </RootText>
    </group>
  );
}

function RotateUI() {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current == null) {
      return;
    }
    ref.current.rotation.y = state.clock.getElapsedTime() * 5;
    ref.current.rotation.x = state.clock.getElapsedTime() * 5;
  });
  return (
    <group position={[0, -0.5, 0]} ref={ref}>
      <RootContainer
        backgroundColor="red"
        anchorX="center"
        anchorY="center"
        padding={0.03}
        id="root"
        pixelSize={0.005}
        overflow="scroll"
      >
        <Suspense>
          <Text index={1} color={"white"} id="lorem-ipsum">
            Hello World!
          </Text>
        </Suspense>
      </RootContainer>
    </group>
  );
}
