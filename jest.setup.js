"use client"

import "@testing-library/jest-dom"

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ""
  },
}))

// Mock Babylon.js for testing
jest.mock("@babylonjs/core", () => ({
  Engine: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
    runRenderLoop: jest.fn(),
    resize: jest.fn(),
  })),
  Scene: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    dispose: jest.fn(),
    onAfterAnimationsObservable: {
      addOnce: jest.fn(),
    },
  })),
  ArcRotateCamera: jest.fn(),
  HemisphericLight: jest.fn(),
  DirectionalLight: jest.fn(),
  Vector3: {
    Zero: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
  },
  MeshBuilder: {
    CreateGround: jest.fn(),
    CreateSphere: jest.fn(),
    CreateCylinder: jest.fn(),
    CreatePlane: jest.fn(),
    CreateLines: jest.fn(),
  },
  StandardMaterial: jest.fn(),
  Color3: jest.fn(),
  Animation: {
    CreateAndStartAnimation: jest.fn(),
    ANIMATIONLOOPMODE_CONSTANT: 0,
  },
  ShadowGenerator: jest.fn(),
}))

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: "div",
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})
