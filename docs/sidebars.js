/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  // tutorialSidebar: [{type: 'autogenerated', dirName: '.'}],

  // But you can create a sidebar manually

  mainSidebar: [
    "main-doc",
        {
      type: "category",
      label: "Getting Started",
      link: {
        type: "generated-index",
        title: "Getting Stared",
        description:
          `In the following tutorials, we will create several UIs using koestlich and react-three/fiber. Install the dependencies manually via \n \`npm i @coconut-xr/koestlich @react-three/fiber react react-dom three\` \n or use the CodeSandbox provided for each example.`,
        keywords: ["WebXR", "koestlich", "ui", "3D", "three", "threejs"],
      },
      collapsed: true,
      collapsible: true,
      items: [
         "getting-started/gs-first-layout",
         "getting-started/gs-scaling",
         "getting-started/gs-async",
         "getting-started/gs-text",
         "getting-started/gs-animations",
         "getting-started/gs-3d-content",
         "getting-started/gs-scroll",
         "getting-started/gs-custom-mats"
      ],
    },
    {
      type: "doc",
      label: "All Koestlich Components",
      id:  "components"
    },
     {
      type: "doc",
      label: "Advanced Features",
      id: "advanced"
    },
         {
      type: "doc",
      label: "Library Development",
      id: "library-development"
    },
    {
      type: "category",
      label: "Ecosystem",
      collapsed: true,
      collapsible: true,
      items: [
        {
          type: "link",
          label: "koestlich",
          href: "https://github.com/coconut-xr/koestlich",
        },
        {
          type: "link",
          label: "natuerlich",
          href: "https://github.com/coconut-xr/natuerlich",
        },
        {
          type: "link",
          label: "apfel-kruemel",
          href: "https://github.com/coconut-xr/apfel-kruemel",
        },
      ],
    },
    {
      type: "link",
      label: "Github",
      href: "https://github.com/coconut-xr/koestlich",
    },
    {
      type: "link",
      label: "Discord",
      href: "https://discord.gg/RbyaXJJaJM",
    },
  ],
};

module.exports = sidebars;
