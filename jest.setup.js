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
jest.mock("@babylonjs/core", () => {
  const Vector3 = jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z }))
  Vector3.Zero = jest.fn(() => new Vector3(0, 0, 0))

  return {
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
    Vector3,
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
  }
})

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: "div",
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock localStorage
const localStorageStore = {}
const localStorageMock = {
  getItem: jest.fn((key) => (Object.prototype.hasOwnProperty.call(localStorageStore, key) ? localStorageStore[key] : null)),
  setItem: jest.fn((key, value) => {
    localStorageStore[key] = String(value)
  }),
  removeItem: jest.fn((key) => {
    delete localStorageStore[key]
  }),
  clear: jest.fn(() => {
    Object.keys(localStorageStore).forEach((key) => {
      delete localStorageStore[key]
    })
  }),
  key: jest.fn((index) => Object.keys(localStorageStore)[index] ?? null),
  get length() {
    return Object.keys(localStorageStore).length
  },
}
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
})

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})
