"use client"

import { useEffect, useRef, useState } from "react"
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  DirectionalLight,
  ShadowGenerator,
  type GroundMesh,
  Mesh,
  Animation,
  type AnimationGroup,
  FollowCamera,
  UniversalCamera,
  CubicEase,
  EasingFunction,
} from "@babylonjs/core"
import type { BallState } from "@/lib/physics/types"
import { CourseManager } from "@/lib/game/courseManager"

interface GameCanvasProps {
  trajectory?: BallState[]
  isAnimating?: boolean
  onAnimationComplete?: () => void
  showTrajectoryPreview?: boolean
  trajectoryPreview?: Array<{ x: number; y: number }>
  className?: string
}

export default function GameCanvas({
  trajectory,
  isAnimating = false,
  onAnimationComplete,
  showTrajectoryPreview = false,
  trajectoryPreview = [],
  className = "",
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const ballRef = useRef<Mesh | null>(null)
  const cameraRef = useRef<ArcRotateCamera | null>(null)
  const followCameraRef = useRef<FollowCamera | null>(null)
  const animationGroupRef = useRef<AnimationGroup | null>(null)
  const trajectoryMeshRef = useRef<Mesh | null>(null)
  const courseManagerRef = useRef<CourseManager | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courseName, setCourseName] = useState<string>('')
  const [cameraIntroComplete, setCameraIntroComplete] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    const initializeBabylon = async () => {
      try {
        // Create engine
        const engine = new Engine(canvasRef.current!, true, {
          antialias: true,
          adaptToDeviceRatio: true,
        })
        engineRef.current = engine

        // Create scene
        const scene = new Scene(engine)
        scene.clearColor = new Color3(0.53, 0.81, 0.92) // Sky blue
        scene.fogMode = Scene.FOGMODE_LINEAR
        scene.fogColor = new Color3(0.8, 0.9, 1)
        scene.fogStart = 40
        scene.fogEnd = 100
        sceneRef.current = scene

        // Create camera starting from aerial view for intro
        const camera = new ArcRotateCamera(
          "camera",
          -Math.PI / 2, // Alpha - looking straight down course
          Math.PI / 12, // Beta - almost overhead view for intro
          80, // Radius - far away for aerial view
          new Vector3(25, 0, 0), // Target - center of course
          scene,
        )
        camera.setTarget(new Vector3(25, 0, 0))
        // Don't attach controls yet - will do after intro
        camera.attachControl(canvasRef.current!, false)

        // Limit camera movement for better UX
        camera.lowerBetaLimit = Math.PI / 8 // Don't go too low
        camera.upperBetaLimit = Math.PI / 2.5 // Don't go too high
        camera.lowerRadiusLimit = 15
        camera.upperRadiusLimit = 60
        camera.wheelPrecision = 20 // Smoother zoom

        cameraRef.current = camera

        // Create lighting
        const hemisphericLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene)
        hemisphericLight.intensity = 0.6

        const directionalLight = new DirectionalLight("dirLight", new Vector3(-1, -1, -1), scene)
        directionalLight.position = new Vector3(20, 40, 20)
        directionalLight.intensity = 0.8

        // Create shadow generator
        const shadowGenerator = new ShadowGenerator(1024, directionalLight)
        shadowGenerator.useBlurExponentialShadowMap = true
        shadowGenerator.blurKernel = 32

        // Create textured golf course ground with fairway
        const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 30, subdivisions: 4 }, scene) as GroundMesh
        ground.position = new Vector3(20, 0, 0)
        const groundMaterial = new StandardMaterial("groundMat", scene)
        groundMaterial.diffuseColor = new Color3(0.15, 0.45, 0.15) // Dark green rough
        groundMaterial.specularColor = new Color3(0.02, 0.02, 0.02)
        ground.material = groundMaterial
        ground.receiveShadows = true
        
        // Create fairway strip - centered path to hole
        const fairway = MeshBuilder.CreateGround("fairway", { width: 55, height: 6 }, scene)
        fairway.position = new Vector3(22.5, 0.01, 0)
        const fairwayMaterial = new StandardMaterial("fairwayMat", scene)
        fairwayMaterial.diffuseColor = new Color3(0.3, 0.65, 0.3) // Lighter green for fairway
        fairwayMaterial.specularColor = new Color3(0.05, 0.05, 0.05)
        fairway.material = fairwayMaterial
        fairway.receiveShadows = true

        // Create elevated tee area with better visibility
        const teeArea = MeshBuilder.CreateBox("teeArea", { width: 4, height: 0.2, depth: 4 }, scene)
        teeArea.position = new Vector3(0, 0.1, 0)
        const teeAreaMaterial = new StandardMaterial("teeAreaMat", scene)
        teeAreaMaterial.diffuseColor = new Color3(0.25, 0.6, 0.25) // Nice green
        teeAreaMaterial.specularColor = new Color3(0.1, 0.1, 0.1)
        teeArea.material = teeAreaMaterial
        
        // Add tee peg - more visible
        const teePeg = MeshBuilder.CreateCylinder("teePeg", { height: 0.1, diameter: 0.03 }, scene)
        teePeg.position = new Vector3(0, 0.05, 0)
        const teePegMaterial = new StandardMaterial("teePegMat", scene)
        teePegMaterial.diffuseColor = new Color3(1, 1, 0.9) // Off-white
        teePegMaterial.emissiveColor = new Color3(0.1, 0.1, 0.05)
        teePeg.material = teePegMaterial

        // Initialize CourseManager and get current course
        const courseManager = new CourseManager()
        courseManagerRef.current = courseManager
        const currentCourse = courseManager.getCurrentCourse()
        setCourseName(currentCourse.name)
        
        console.log('[GAME] Playing on course:', currentCourse.name, 'Difficulty:', currentCourse.difficulty)
        
        // Apply course theme to materials
        groundMaterial.diffuseColor = currentCourse.theme.groundColor
        fairwayMaterial.diffuseColor = currentCourse.theme.fairwayColor
        
        // Update fairway width based on course
        fairway.scaling.x = currentCourse.fairwayWidth / 6 // Adjust fairway width
        
        // Create multi-layered putting green at course-specific hole position
        const puttingGreenOuter = MeshBuilder.CreateCylinder("puttingGreenOuter", { height: 0.015, diameter: 10 }, scene)
        puttingGreenOuter.position = new Vector3(currentCourse.holePosition.x, 0.007, currentCourse.holePosition.z)
        const greenOuterMaterial = new StandardMaterial("greenOuterMat", scene)
        greenOuterMaterial.diffuseColor = new Color3(0.32, 0.68, 0.32) // Medium green
        greenOuterMaterial.specularColor = new Color3(0.08, 0.08, 0.08)
        puttingGreenOuter.material = greenOuterMaterial
        
        const puttingGreenInner = MeshBuilder.CreateCylinder("puttingGreenInner", { height: 0.02, diameter: 6 }, scene)
        puttingGreenInner.position = new Vector3(currentCourse.holePosition.x, 0.01, currentCourse.holePosition.z)
        const greenInnerMaterial = new StandardMaterial("greenInnerMat", scene)
        greenInnerMaterial.diffuseColor = new Color3(0.38, 0.75, 0.38) // Bright smooth green
        greenInnerMaterial.specularColor = new Color3(0.12, 0.12, 0.12)
        puttingGreenInner.material = greenInnerMaterial
        
        // Create MORE VISIBLE hole with proper depth - make it bigger and more obvious
        const holeDiameter = currentCourse.holeDiameter * 1.5 // Make hole 50% bigger for visibility
        
        // Create visible hole depression in the green
        const holeDepression = MeshBuilder.CreateCylinder("holeDepression", { 
          height: 0.01, 
          diameter: holeDiameter + 0.3 
        }, scene)
        holeDepression.position = new Vector3(currentCourse.holePosition.x, 0.005, currentCourse.holePosition.z)
        const depressionMaterial = new StandardMaterial("depressionMat", scene)
        depressionMaterial.diffuseColor = new Color3(0.25, 0.5, 0.25) // Darker green around hole
        depressionMaterial.specularColor = new Color3(0.05, 0.05, 0.05)
        holeDepression.material = depressionMaterial
        
        // Create the actual hole - VERY VISIBLE BLACK HOLE
        const holeOuter = MeshBuilder.CreateCylinder("holeOuter", { 
          height: 0.4, 
          diameter: holeDiameter + 0.1 
        }, scene)
        holeOuter.position = new Vector3(currentCourse.holePosition.x, -0.2, currentCourse.holePosition.z)
        const holeOuterMaterial = new StandardMaterial("holeOuterMat", scene)
        holeOuterMaterial.diffuseColor = new Color3(0.02, 0.02, 0.02) // Very dark
        holeOuterMaterial.specularColor = new Color3(0, 0, 0)
        holeOuterMaterial.emissiveColor = new Color3(0, 0, 0)
        holeOuter.material = holeOuterMaterial
        
        const holeInner = MeshBuilder.CreateCylinder("holeInner", { 
          height: 0.5, 
          diameter: holeDiameter 
        }, scene)
        holeInner.position = new Vector3(currentCourse.holePosition.x, -0.25, currentCourse.holePosition.z)
        const holeInnerMaterial = new StandardMaterial("holeInnerMat", scene)
        holeInnerMaterial.diffuseColor = new Color3(0, 0, 0) // Pure black for maximum visibility
        holeInnerMaterial.specularColor = new Color3(0, 0, 0)
        holeInnerMaterial.emissiveColor = new Color3(0, 0, 0)
        holeInner.material = holeInnerMaterial
        
        // Add bright white professional hole cup rim for contrast - HORIZONTAL on ground
        const cupRim = MeshBuilder.CreateTorus("cupRim", { 
          diameter: holeDiameter + 0.15, 
          thickness: 0.04,
          tessellation: 32 
        }, scene)
        cupRim.position = new Vector3(currentCourse.holePosition.x, 0.01, currentCourse.holePosition.z) // Slightly above ground
        // NO rotation needed - torus is horizontal by default in Babylon.js
        const cupRimMaterial = new StandardMaterial("cupRimMat", scene)
        cupRimMaterial.diffuseColor = new Color3(1, 1, 1) // Bright white for visibility
        cupRimMaterial.specularColor = new Color3(0.9, 0.9, 0.9)
        cupRimMaterial.specularPower = 128
        cupRimMaterial.emissiveColor = new Color3(0.3, 0.3, 0.3) // Glow for visibility
        cupRim.material = cupRimMaterial
        
        // Store actual hole size for physics (with the increased size)
        scene.metadata = { ...scene.metadata, actualHoleDiameter: holeDiameter }

        // Create professional flag setup
        // Flag pole with tapered design
        const flagPole = MeshBuilder.CreateCylinder("flagPole", { 
          height: 3, 
          diameterTop: 0.012,
          diameterBottom: 0.018,
          tessellation: 8 
        }, scene)
        flagPole.position = new Vector3(currentCourse.holePosition.x, 1.5, currentCourse.holePosition.z)
        const flagPoleMaterial = new StandardMaterial("flagPoleMat", scene)
        flagPoleMaterial.diffuseColor = new Color3(0.95, 0.95, 0.1) // Yellow pole (golf standard)
        flagPoleMaterial.specularColor = new Color3(0.7, 0.7, 0.5)
        flagPoleMaterial.specularPower = 80
        flagPoleMaterial.emissiveColor = new Color3(0.1, 0.1, 0.02)
        flagPole.material = flagPoleMaterial
        
        // Create triangular flag (more realistic)
        const flagPath = [
          new Vector3(0, 0, 0),
          new Vector3(0.7, 0.25, 0),
          new Vector3(0, 0.5, 0),
          new Vector3(0, 0, 0)
        ]
        const flag = MeshBuilder.CreateRibbon("flag", {
          pathArray: [flagPath, flagPath.map(v => new Vector3(v.x, v.y, 0.02))],
          sideOrientation: Mesh.DOUBLESIDE
        }, scene)
        flag.position = new Vector3(currentCourse.holePosition.x + 0.02, 2.3, currentCourse.holePosition.z)
        flag.rotation.y = Math.PI / 2
        
        const flagMaterial = new StandardMaterial("flagMat", scene)
        flagMaterial.diffuseColor = new Color3(1, 0, 0) // Classic red
        flagMaterial.specularColor = new Color3(0.3, 0.1, 0.1)
        flagMaterial.emissiveColor = new Color3(0.1, 0, 0)
        flagMaterial.backFaceCulling = false
        flag.material = flagMaterial
        
        // Add hole number on flag
        const flagNumber = MeshBuilder.CreatePlane("flagNumber", { width: 0.3, height: 0.2 }, scene)
        flagNumber.position = new Vector3(currentCourse.holePosition.x + 0.35, 2.3, currentCourse.holePosition.z + 0.01)
        flagNumber.rotation.y = Math.PI / 2
        const flagNumberMat = new StandardMaterial("flagNumberMat", scene)
        flagNumberMat.diffuseColor = new Color3(1, 1, 1)
        flagNumberMat.emissiveColor = new Color3(0.2, 0.2, 0.2)
        flagNumber.material = flagNumberMat
        
        // Animate flag waving more realistically
        scene.registerBeforeRender(() => {
          const time = Date.now() * 0.001
          flag.rotation.z = Math.sin(time) * 0.08 + Math.sin(time * 2.3) * 0.03
          flag.position.x = currentCourse.holePosition.x + 0.02 + Math.sin(time * 1.5) * 0.01
        })

        // Create golf ball - make it bigger for visibility
        const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.2, segments: 16 }, scene) // Larger for visibility
        ball.position = new Vector3(0, 0.15, 0) // Sitting on tee
        const ballMaterial = new StandardMaterial("ballMat", scene)
        ballMaterial.diffuseColor = new Color3(1, 1, 1) // Pure white ball
        ballMaterial.specularColor = new Color3(0.9, 0.9, 0.9)
        ballMaterial.specularPower = 128
        ballMaterial.emissiveColor = new Color3(0.1, 0.1, 0.1) // Slight glow for visibility
        ball.material = ballMaterial

        // Add ball to shadow casters
        shadowGenerator.addShadowCaster(ball)
        ballRef.current = ball
        
        // Create professional right-handed golf club (driver)
        // Club shaft - angled for right-handed player
        const clubShaft = MeshBuilder.CreateCylinder("clubShaft", { 
          height: 3.5, 
          diameterTop: 0.025,
          diameterBottom: 0.04,
          tessellation: 16 
        }, scene)
        clubShaft.position = new Vector3(-0.5, 1.75, -0.3) // Offset to right for right-handed stance
        clubShaft.rotation.z = Math.PI / 12 // Slight angle
        clubShaft.rotation.x = -Math.PI / 30 // Lean forward slightly
        const shaftMaterial = new StandardMaterial("shaftMat", scene)
        shaftMaterial.diffuseColor = new Color3(0.15, 0.15, 0.15) // Dark graphite
        shaftMaterial.specularColor = new Color3(0.9, 0.9, 0.9)
        shaftMaterial.specularPower = 150
        shaftMaterial.metallic = 0.8
        shaftMaterial.emissiveColor = new Color3(0.02, 0.02, 0.02)
        clubShaft.material = shaftMaterial
        
        // Club grip with texture
        const clubGrip = MeshBuilder.CreateCylinder("clubGrip", { 
          height: 0.9, 
          diameterTop: 0.065,
          diameterBottom: 0.075,
          tessellation: 12 
        }, scene)
        clubGrip.position = new Vector3(-0.75, 3.15, -0.38)
        clubGrip.rotation.z = Math.PI / 12
        clubGrip.rotation.x = -Math.PI / 30
        const gripMaterial = new StandardMaterial("gripMat", scene)
        gripMaterial.diffuseColor = new Color3(0.08, 0.08, 0.08) // Almost black rubber
        gripMaterial.specularColor = new Color3(0.15, 0.15, 0.15)
        gripMaterial.roughness = 0.9
        clubGrip.material = gripMaterial
        
        // Professional driver head - larger and more realistic
        const clubHead = MeshBuilder.CreateBox("clubHead", { 
          width: 0.45, 
          height: 0.18, 
          depth: 0.35 
        }, scene)
        clubHead.position = new Vector3(-0.25, 0.09, -0.22)
        clubHead.rotation.y = -Math.PI / 10 // Angle for right-handed address
        const headMaterial = new StandardMaterial("headMat", scene)
        headMaterial.diffuseColor = new Color3(0.1, 0.1, 0.1) // Black titanium
        headMaterial.specularColor = new Color3(1, 1, 1)
        headMaterial.specularPower = 200
        headMaterial.metallic = 0.95
        headMaterial.emissiveColor = new Color3(0.05, 0.05, 0.05)
        clubHead.material = headMaterial
        
        // Club face with grooves effect
        const clubFace = MeshBuilder.CreateBox("clubFace", { 
          width: 0.38, 
          height: 0.16, 
          depth: 0.005 
        }, scene)
        clubFace.position = new Vector3(-0.05, 0.09, -0.22)
        clubFace.rotation.y = -Math.PI / 10
        const faceMaterial = new StandardMaterial("faceMat", scene)
        faceMaterial.diffuseColor = new Color3(0.92, 0.92, 0.92) // Polished steel face
        faceMaterial.specularColor = new Color3(1, 1, 1)
        faceMaterial.specularPower = 300
        faceMaterial.metallic = 1.0
        faceMaterial.emissiveColor = new Color3(0.1, 0.1, 0.1)
        clubFace.material = faceMaterial
        
        // Add hosel (connection between shaft and head)
        const hosel = MeshBuilder.CreateCylinder("hosel", {
          height: 0.15,
          diameter: 0.045,
          tessellation: 12
        }, scene)
        hosel.position = new Vector3(-0.27, 0.18, -0.32)
        hosel.rotation.z = Math.PI / 12
        hosel.material = headMaterial
        
        // Add brand detail on crown
        const crownDetail = MeshBuilder.CreateBox("crownDetail", {
          width: 0.15,
          height: 0.001,
          depth: 0.08
        }, scene)
        crownDetail.position = new Vector3(-0.25, 0.181, -0.22)
        crownDetail.rotation.y = -Math.PI / 10
        const crownMaterial = new StandardMaterial("crownMat", scene)
        crownMaterial.diffuseColor = new Color3(0.8, 0.1, 0.1) // Red accent
        crownMaterial.emissiveColor = new Color3(0.2, 0.02, 0.02)
        crownDetail.material = crownMaterial
        
        // Merge club parts for better performance
        const clubParts = [clubShaft, clubGrip, clubHead, clubFace, hosel, crownDetail]
        const mergedClub = Mesh.MergeMeshes(clubParts, true, true, undefined, false, true)
        if (mergedClub) {
          mergedClub.name = "golfClub"
          // Add subtle idle animation - slight waggle like real golfers
          scene.registerBeforeRender(() => {
            if (mergedClub && !isAnimating) {
              const time = Date.now() * 0.001
              mergedClub.rotation.y = Math.sin(time * 0.5) * 0.03 // Subtle waggle
              mergedClub.position.y = Math.sin(time * 2) * 0.01 // Slight vertical movement
            }
          })
        }

        // Build course-specific details (bunkers, trees, etc.)
        courseManager.buildCourse(scene, shadowGenerator)
        
        // Create professional nets around the course and store for collision detection
        const nets = createCourseNets(scene, currentCourse)
        
        // Store nets and hole info in scene metadata for access in animation
        scene.metadata = { 
          nets,
          actualHoleDiameter: currentCourse.holeDiameter * 1.5, // Store the enlarged hole size
          holePosition: currentCourse.holePosition
        }

        // Start render loop
        engine.runRenderLoop(() => {
          scene.render()
        })

        // Handle resize
        const handleResize = () => {
          engine.resize()
        }
        window.addEventListener("resize", handleResize)

        setIsLoading(false)
        
        // Start cinematic camera intro after scene loads
        setTimeout(() => {
          animateCameraIntro(camera, scene, () => {
            setCameraIntroComplete(true)
            camera.attachControl(canvasRef.current!, true)
          })
        }, 500)

        return () => {
          window.removeEventListener("resize", handleResize)
          engine.dispose()
        }
      } catch (err) {
        console.error("Failed to initialize Babylon.js:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize 3D scene")
        setIsLoading(false)
      }
    }

    initializeBabylon()

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose()
      }
    }
  }, [])

  // Handle trajectory animation
  useEffect(() => {
    if (!trajectory || !ballRef.current || !sceneRef.current || !isAnimating) return

    const scene = sceneRef.current
    const ball = ballRef.current
    const nets = scene.metadata?.nets || []
    
    // Animate golf club swing when shooting
    const golfClub = scene.getMeshByName("golfClub")
    if (golfClub) {
      // Create swing animation
      const swingAnimation = new Animation(
        "clubSwing",
        "rotation.z",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      )
      
      const swingKeys = [
        { frame: 0, value: Math.PI / 10 },
        { frame: 5, value: -Math.PI / 6 }, // Backswing
        { frame: 10, value: Math.PI / 4 }, // Follow through
        { frame: 20, value: Math.PI / 10 } // Return to rest
      ]
      
      swingAnimation.setKeys(swingKeys)
      golfClub.animations = [swingAnimation]
      scene.beginAnimation(golfClub, 0, 20, false)
    }

    // Clear previous animation
    if (animationGroupRef.current) {
      animationGroupRef.current.dispose()
    }

    // Create keyframes for realistic trajectory with collision detection
    const positionKeys: any[] = []
    let previousVelocity = { x: 0, y: 0, z: 0 }
    let ballStoppedAtBoundaryFrame = -1 // Track when ball stops at boundary
    let ballInHole = false
    const holePos = scene.metadata?.holePosition || { x: 45, z: 0 }
    const holeDiameter = scene.metadata?.actualHoleDiameter || 0.5
    
    trajectory.forEach((state, index) => {
      let ballPos = new Vector3(
        state.position.x,
        Math.max(state.position.y + 0.1, 0.1),
        state.position.y * 0.1
      )
      
      // Check if ball is inside the hole to trigger drop animation
      const distToHole = Math.sqrt(
        Math.pow(ballPos.x - holePos.x, 2) + 
        Math.pow(ballPos.z - holePos.z, 2)
      )
      
      // For drop animation: Ball inside the visual hole boundary
      // holeDiameter is already 1.5x enlarged, so use a portion of it
      const dropRadius = holeDiameter * 0.35 // Ball must be inside to animate drop
      
      // Trigger drop if ball is inside hole - speed check only for smooth animation
      // Fast balls will still drop, just more dramatically!
      if (distToHole < dropRadius && !ballInHole) {
        // Ball is IN THE HOLE - animate dropping
        ballInHole = true
        // Mark the frame where ball starts dropping
        scene.metadata = { ...scene.metadata, ballDropStartFrame: index, ballInHoleFrame: index, ballWillWin: true }
        console.log('[ANIMATION] Ball IN HOLE - animating drop at frame', index, 'distance:', distToHole.toFixed(3), 'dropRadius:', dropRadius.toFixed(3))
      }
      
      // If ball is in hole, animate smooth dropping
      if (ballInHole) {
        const dropStartFrame = scene.metadata?.ballDropStartFrame || index
        const framesDropping = index - dropStartFrame
        
        // Smooth drop animation with proper physics
        const dropAcceleration = 0.02 // Gravity effect
        const maxDropSpeed = 0.5
        const targetY = -0.4 // Final depth in hole
        
        // Smoothly center ball on hole over first few frames
        const centeringSpeed = 0.15
        if (framesDropping < 10) {
          const centeringFactor = Math.min(1, framesDropping * centeringSpeed)
          ballPos.x = ballPos.x + (holePos.x - ballPos.x) * centeringFactor
          ballPos.z = ballPos.z + (holePos.z - ballPos.z) * centeringFactor
        } else {
          // Fully centered
          ballPos.x = holePos.x
          ballPos.z = holePos.z
        }
        
        // Smooth falling animation with acceleration
        if (ballPos.y > targetY) {
          const dropVelocity = Math.min(maxDropSpeed, dropAcceleration * framesDropping)
          ballPos.y = Math.max(targetY, 0.1 - dropVelocity * framesDropping * 0.015)
          
          // Add slight bounce when hitting bottom
          if (ballPos.y <= targetY + 0.05 && framesDropping > 20) {
            ballPos.y = targetY + Math.abs(Math.sin(framesDropping * 0.3)) * 0.02
          }
        } else {
          ballPos.y = targetY
        }
      }
      
      // Check collision boundaries (simplified boundary checking)
      let hitBoundary = false
      
      // Only check boundaries if not in hole
      if (!ballInHole) {
        // Left boundary check
        if (ballPos.z > 14.5) {
          ballPos.z = 14.5
          hitBoundary = true
          if (ballStoppedAtBoundaryFrame === -1 && Math.abs(previousVelocity.z) < 0.5) {
            ballStoppedAtBoundaryFrame = index
          }
          // Bounce back with dampening
          if (previousVelocity.z > 0) {
            ballPos.z = 14.3 // Move slightly back from boundary
          }
        }
        
        // Right boundary check
        if (ballPos.z < -14.5) {
          ballPos.z = -14.5
          hitBoundary = true
          if (ballStoppedAtBoundaryFrame === -1 && Math.abs(previousVelocity.z) < 0.5) {
            ballStoppedAtBoundaryFrame = index
          }
          // Bounce back with dampening
          if (previousVelocity.z < 0) {
            ballPos.z = -14.3 // Move slightly back from boundary
          }
        }
        
        // Back boundary check (behind hole)
        if (ballPos.x > 64.5) {
          ballPos.x = 64.5
          hitBoundary = true
          if (ballStoppedAtBoundaryFrame === -1 && Math.abs(previousVelocity.x) < 0.5) {
            ballStoppedAtBoundaryFrame = index
          }
          // Bounce back with dampening
          if (previousVelocity.x > 0) {
            ballPos.x = 64.3 // Move slightly back from boundary
          }
        }
        
        // Front boundary check (behind tee - updated for new position)
        if (ballPos.x < -19.5) {
          ballPos.x = -19.5
          hitBoundary = true
          if (ballStoppedAtBoundaryFrame === -1 && Math.abs(previousVelocity.x) < 0.5) {
            ballStoppedAtBoundaryFrame = index
          }
          // Bounce back with dampening
          if (previousVelocity.x < 0) {
            ballPos.x = -19.3 // Move slightly back from boundary
          }
        }
      }
      
      // Keep ball above ground (unless in hole)
      if (!ballInHole && ballPos.y < 0.1) {
        ballPos.y = 0.1
      }
      
      // Update velocity for next frame
      if (index > 0) {
        const prevKey = positionKeys[index - 1]
        if (prevKey) {
          previousVelocity = {
            x: ballPos.x - prevKey.value.x,
            y: ballPos.y - prevKey.value.y,
            z: ballPos.z - prevKey.value.z
          }
        }
      }
      
      positionKeys.push({
        frame: index,
        value: ballPos
      })
    })
    
    // Store if ball went in hole for later use
    scene.metadata = { ...scene.metadata, ballInHole }

    // Create position animation
    const positionAnimation = new Animation(
      "ballPosition",
      "position",
      60, // 60 FPS
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    positionAnimation.setKeys(positionKeys)

    // Create rotation animation for spin effect
    const rotationKeys = trajectory.map((state, index) => ({
      frame: index,
      value: new Vector3(
        index * 0.1, // X rotation based on distance
        0,
        index * 0.05, // Z rotation for spin
      ),
    }))

    const rotationAnimation = new Animation(
      "ballRotation",
      "rotation",
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    rotationAnimation.setKeys(rotationKeys)

    // Apply animations to ball
    ball.animations = [positionAnimation, rotationAnimation]
    
    // Start animation and handle completion with precise timing
    const animationSpeed = 1.0 // Normal speed
    const animatable = scene.beginAnimation(ball, 0, trajectory.length - 1, false, animationSpeed, () => {
      console.log('[CANVAS] Ball animation completed at frame:', trajectory.length - 1)
      console.log('[CANVAS] Final ball position:', ball.position)
      
      // Check if ball went in hole - if so, add extra delay for drop animation
      const ballInHole = scene.metadata?.ballInHole
      const delayTime = ballInHole ? 800 : 100 // Longer delay if ball is in hole
      
      // Add delay for ball to visually settle (especially important for hole drops)
      setTimeout(() => {
        console.log('[CANVAS] Calling onAnimationComplete callback after drop animation')
        onAnimationComplete?.()
      }, delayTime)
    })

    // Smooth camera follow animation with proper boundary stopping
    if (cameraRef.current && trajectory.length > 0) {
      const camera = cameraRef.current
      const animationFrameRate = 60
      
      // Determine the exact frame where camera should stop
      let cameraStopFrame = trajectory.length - 1
      
      // Check if ball went in hole - stop camera there
      const ballInHoleFrame = scene.metadata?.ballInHoleFrame
      if (ballInHoleFrame !== undefined && ballInHoleFrame > 0) {
        cameraStopFrame = Math.min(ballInHoleFrame + 10, trajectory.length - 1) // Stop shortly after ball enters hole
        console.log('[CAMERA] Ball in hole - stopping camera at frame:', cameraStopFrame)
      } else {
        // Check each position key to find where ball actually stops at boundary
        for (let i = 0; i < positionKeys.length; i++) {
          const pos = positionKeys[i]?.value
          const nextPos = positionKeys[i + 1]?.value
          
          if (pos && nextPos) {
            // Check if ball has effectively stopped moving (very small movement)
            const movement = Math.sqrt(
              Math.pow(nextPos.x - pos.x, 2) + 
              Math.pow(nextPos.z - pos.z, 2)
            )
            
            // If at boundary and barely moving, this is where we stop
            const atBoundary = (
              Math.abs(pos.x - 64.3) < 1 || Math.abs(pos.x - (-19.3)) < 1 ||
              Math.abs(pos.z - 14.3) < 1 || Math.abs(pos.z - (-14.3)) < 1
            )
            
            if (atBoundary && movement < 0.1) {
              cameraStopFrame = i
              console.log('[CAMERA] Stopping camera at boundary frame:', i)
              break
            }
          }
        }
      }
      
      // Create camera follow keys only up to stop frame
      const cameraFollowKeys: any[] = []
      const cameraPositionKeys: any[] = []
      
      for (let i = 0; i <= cameraStopFrame; i++) {
        const state = trajectory[i]
        if (!state) continue
        
        const ballX = state.position.x
        const ballY = state.position.y
        
        // Camera target (where it looks)
        cameraFollowKeys.push({
          frame: i,
          value: new Vector3(
            Math.min(ballX + 2, 63), // Don't go past back boundary
            0,
            0
          )
        })
        
        // Camera position (where it is)
        cameraPositionKeys.push({
          frame: i,
          value: new Vector3(
            Math.max(-18, Math.min(ballX - 10, 50)), // Keep camera within bounds
            Math.max(8, ballY + 10), // Stay above ball
            0
          )
        })
      }
      
      // Create the camera target animation
      const cameraTargetAnimation = new Animation(
        "cameraFollow",
        "target",
        animationFrameRate,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      )
      cameraTargetAnimation.setKeys(cameraFollowKeys)
      
      // Create camera position animation
      const cameraPositionAnimation = new Animation(
        "cameraPosition",
        "position",
        animationFrameRate,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      )
      cameraPositionAnimation.setKeys(cameraPositionKeys)
      
      // Apply both animations to camera
      camera.animations = [cameraTargetAnimation, cameraPositionAnimation]
      
      // Start camera animation - stop at the determined frame
      scene.beginAnimation(camera, 0, cameraStopFrame, false, animationSpeed)
    }
  }, [trajectory, isAnimating, onAnimationComplete])

  // Handle trajectory preview
  useEffect(() => {
    if (!sceneRef.current) return

    const scene = sceneRef.current

    // Remove existing trajectory preview
    if (trajectoryMeshRef.current) {
      trajectoryMeshRef.current.dispose()
      trajectoryMeshRef.current = null
    }

    if (showTrajectoryPreview && trajectoryPreview.length > 1) {
      // Create trajectory line
      const points = trajectoryPreview.map((point) => new Vector3(point.x, Math.max(point.y, 0), point.y * 0.05))

      const trajectoryLine = MeshBuilder.CreateLines("trajectoryPreview", { points }, scene)
      const trajectoryMaterial = new StandardMaterial("trajectoryMat", scene)
      trajectoryMaterial.emissiveColor = new Color3(1, 1, 0) // Yellow preview line
      trajectoryLine.color = new Color3(1, 1, 0)
      trajectoryLine.alpha = 0.7

      trajectoryMeshRef.current = trajectoryLine
    }
  }, [showTrajectoryPreview, trajectoryPreview])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="text-red-600 text-lg font-semibold mb-2">3D Scene Error</div>
          <div className="text-red-500 text-sm">{error}</div>
          <div className="text-red-400 text-xs mt-2">Please check your browser's WebGL support</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <div className="text-gray-600 text-sm">Loading 3D Golf Course...</div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full rounded-lg" style={{ outline: "none" }} tabIndex={0} />
      {!isLoading && (
        <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Click and drag to rotate • Scroll to zoom
        </div>
      )}
    </div>
  )
}

function createCourseDetails(scene: Scene, shadowGenerator: ShadowGenerator) {
  // Add trees in organized positions along the sides
  const treePositions = [
    { x: 10, z: 12 },
    { x: 25, z: 13 },
    { x: 40, z: 12 },
    { x: 10, z: -12 },
    { x: 25, z: -13 },
    { x: 40, z: -12 },
    { x: 55, z: 8 },
    { x: 55, z: -8 },
  ]
  
  treePositions.forEach((pos, i) => {
    const tree = createSimpleTree(scene, `tree${i}`)
    tree.position = new Vector3(pos.x, 0, pos.z)
    shadowGenerator.addShadowCaster(tree)
  })

  // Add sand bunkers strategically placed
  const bunker1 = MeshBuilder.CreateCylinder("bunker1", { height: 0.05, diameter: 6 }, scene)
  bunker1.position = new Vector3(20, 0.025, -6)
  const bunkerMaterial = new StandardMaterial("bunkerMat", scene)
  bunkerMaterial.diffuseColor = new Color3(0.9, 0.8, 0.6) // Sand color
  bunkerMaterial.specularColor = new Color3(0.1, 0.1, 0.1)
  bunker1.material = bunkerMaterial

  const bunker2 = MeshBuilder.CreateCylinder("bunker2", { height: 0.05, diameter: 5 }, scene)
  bunker2.position = new Vector3(35, 0.025, 7)
  bunker2.material = bunkerMaterial
  
  // Add distance markers
  for (let dist = 10; dist <= 40; dist += 10) {
    const marker = MeshBuilder.CreateBox(`marker${dist}`, { width: 0.5, height: 1, depth: 0.1 }, scene)
    marker.position = new Vector3(dist, 0.5, -10)
    const markerMat = new StandardMaterial(`markerMat${dist}`, scene)
    markerMat.diffuseColor = new Color3(1, 1, 1)
    markerMat.emissiveColor = new Color3(0.2, 0.2, 0.2)
    marker.material = markerMat
  }
}

function createSimpleTree(scene: Scene, name: string): Mesh {
  // Create simple tree with trunk and foliage
  const trunk = MeshBuilder.CreateCylinder(`${name}_trunk`, { height: 4, diameter: 0.4 }, scene)
  const trunkMaterial = new StandardMaterial(`${name}_trunkMat`, scene)
  trunkMaterial.diffuseColor = new Color3(0.35, 0.2, 0.1) // Brown
  trunkMaterial.specularColor = new Color3(0.1, 0.1, 0.1)
  trunk.material = trunkMaterial
  trunk.position.y = 2

  const foliage = MeshBuilder.CreateSphere(`${name}_foliage`, { diameter: 3, segments: 8 }, scene)
  const foliageMaterial = new StandardMaterial(`${name}_foliageMat`, scene)
  foliageMaterial.diffuseColor = new Color3(0.1, 0.35, 0.1) // Dark green
  foliageMaterial.specularColor = new Color3(0.05, 0.05, 0.05)
  foliage.material = foliageMaterial
  foliage.position.y = 4.5

  // Merge into single mesh for performance
  const tree = Mesh.MergeMeshes([trunk, foliage], true, true, undefined, false, true)
  if (tree) {
    tree.name = name
    return tree
  }
  return trunk // Fallback
}

function createCourseNets(scene: Scene, course: any) {
  // Create professional safety nets around the course
  const netHeight = 15
  const nets: Mesh[] = [] // Store net meshes for collision detection
  
  // Create professional checkered net pattern using grid of lines
  const createNetMesh = (name: string, width: number, height: number) => {
    const lines = []
    const gridSize = 0.3 // Size of each grid square
    
    // Vertical lines
    for (let x = -width/2; x <= width/2; x += gridSize) {
      lines.push([new Vector3(x, -height/2, 0), new Vector3(x, height/2, 0)])
    }
    
    // Horizontal lines
    for (let y = -height/2; y <= height/2; y += gridSize) {
      lines.push([new Vector3(-width/2, y, 0), new Vector3(width/2, y, 0)])
    }
    
    // Create mesh from lines
    const netMesh = MeshBuilder.CreateLineSystem(name, { lines }, scene)
    const netMaterial = new StandardMaterial(`${name}Mat`, scene)
    netMaterial.diffuseColor = new Color3(0.15, 0.15, 0.15) // Dark gray
    netMaterial.emissiveColor = new Color3(0.05, 0.05, 0.05) // Slight glow
    netMaterial.alpha = 0.9
    netMesh.material = netMaterial
    
    // Create invisible collision box for the net
    const collisionBox = MeshBuilder.CreateBox(`${name}Collision`, { 
      width: width, 
      height: height, 
      depth: 0.5 
    }, scene)
    collisionBox.isVisible = false
    collisionBox.checkCollisions = true
    
    return { netMesh, collisionBox }
  }
  
  // Create net posts material
  const postMaterial = new StandardMaterial("postMat", scene)
  postMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3) // Gray posts
  postMaterial.specularColor = new Color3(0.1, 0.1, 0.1)
  
  // Left side net (along Z axis)
  const leftNetData = createNetMesh("leftNet", 75, netHeight)
  leftNetData.netMesh.position = new Vector3(25, netHeight/2, 15)
  leftNetData.collisionBox.position = new Vector3(25, netHeight/2, 15)
  nets.push(leftNetData.collisionBox)
  
  // Right side net
  const rightNetData = createNetMesh("rightNet", 75, netHeight)
  rightNetData.netMesh.position = new Vector3(25, netHeight/2, -15)
  rightNetData.netMesh.rotation.y = Math.PI
  rightNetData.collisionBox.position = new Vector3(25, netHeight/2, -15)
  nets.push(rightNetData.collisionBox)
  
  // Back net (behind hole)
  const backNetData = createNetMesh("backNet", 35, netHeight)
  backNetData.netMesh.position = new Vector3(65, netHeight/2, 0)
  backNetData.netMesh.rotation.y = -Math.PI / 2
  backNetData.collisionBox.position = new Vector3(65, netHeight/2, 0)
  backNetData.collisionBox.rotation.y = -Math.PI / 2
  nets.push(backNetData.collisionBox)
  
  // Front net (behind tee - partial height, moved further back)
  const frontNetData = createNetMesh("frontNet", 35, netHeight * 0.6)
  frontNetData.netMesh.position = new Vector3(-20, netHeight * 0.3, 0)  // Moved from -10 to -20
  frontNetData.netMesh.rotation.y = Math.PI / 2
  frontNetData.collisionBox.position = new Vector3(-20, netHeight * 0.3, 0)
  frontNetData.collisionBox.rotation.y = Math.PI / 2
  nets.push(frontNetData.collisionBox)
  
  // Create support posts for nets (updated for new front net position)
  const postPositions = [
    { x: -20, z: 15 }, { x: 15, z: 15 }, { x: 35, z: 15 }, { x: 55, z: 15 }, { x: 65, z: 15 },
    { x: -20, z: -15 }, { x: 15, z: -15 }, { x: 35, z: -15 }, { x: 55, z: -15 }, { x: 65, z: -15 },
    { x: 65, z: -7.5 }, { x: 65, z: 7.5 },
    { x: -20, z: -7.5 }, { x: -20, z: 7.5 }
  ]
  
  postPositions.forEach((pos, i) => {
    const post = MeshBuilder.CreateCylinder(`post${i}`, { 
      height: netHeight, 
      diameter: 0.3,
      tessellation: 8 
    }, scene)
    post.position = new Vector3(pos.x, netHeight/2, pos.z)
    post.material = postMaterial
  })
  
  // Add top support cables
  const cableMaterial = new StandardMaterial("cableMat", scene)
  cableMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2)
  cableMaterial.emissiveColor = new Color3(0.05, 0.05, 0.05)
  
  // Top cable along left side
  const leftCable = MeshBuilder.CreateCylinder("leftCable", {
    height: 75,
    diameter: 0.05,
    tessellation: 4
  }, scene)
  leftCable.position = new Vector3(25, netHeight, 15)
  leftCable.rotation.z = Math.PI / 2
  leftCable.material = cableMaterial
  
  // Top cable along right side
  const rightCable = MeshBuilder.CreateCylinder("rightCable", {
    height: 75,
    diameter: 0.05,
    tessellation: 4
  }, scene)
  rightCable.position = new Vector3(25, netHeight, -15)
  rightCable.rotation.z = Math.PI / 2
  rightCable.material = cableMaterial
  
  // Return nets for collision detection
  return nets
}

function animateCameraIntro(camera: ArcRotateCamera, scene: Scene, onComplete: () => void) {
  // Create cinematic camera intro animation
  const frameRate = 60
  const totalFrames = 240 // 4 seconds at 60fps for smoother transition
  
  // Alpha animation (horizontal rotation to get behind golf club)
  const alphaAnimation = new Animation(
    "cameraAlpha",
    "alpha",
    frameRate,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  )
  
  const alphaKeys = [
    { frame: 0, value: -Math.PI / 2 }, // Start looking down course
    { frame: 60, value: -Math.PI / 2 }, // Hold aerial view
    { frame: 120, value: -Math.PI / 1.8 }, // Start rotating to get behind
    { frame: 180, value: -Math.PI / 1.5 }, // Continue rotating
    { frame: 240, value: -Math.PI / 1.3 } // Final position behind golf club
  ]
  alphaAnimation.setKeys(alphaKeys)
  
  // Beta animation (vertical rotation - tilt down for FPS view)
  const betaAnimation = new Animation(
    "cameraBeta",
    "beta",
    frameRate,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  )
  
  const betaKeys = [
    { frame: 0, value: Math.PI / 12 }, // Almost overhead
    { frame: 60, value: Math.PI / 8 }, // Start tilting
    { frame: 120, value: Math.PI / 4 }, // More tilt
    { frame: 180, value: Math.PI / 3 }, // Getting to player height
    { frame: 240, value: Math.PI / 2.8 } // Final FPP angle - slightly elevated
  ]
  betaAnimation.setKeys(betaKeys)
  
  // Radius animation (zoom in very close to golf club)
  const radiusAnimation = new Animation(
    "cameraRadius",
    "radius",
    frameRate,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  )
  
  const radiusKeys = [
    { frame: 0, value: 80 }, // Far away aerial view
    { frame: 60, value: 70 }, // Start zooming
    { frame: 120, value: 45 }, // Getting closer
    { frame: 180, value: 20 }, // Much closer
    { frame: 240, value: 8 } // Very close - just behind golf club for FPS feel
  ]
  radiusAnimation.setKeys(radiusKeys)
  
  // Target animation (move focus to golf ball/club position)
  const targetAnimation = new Animation(
    "cameraTarget",
    "target",
    frameRate,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  )
  
  const targetKeys = [
    { frame: 0, value: new Vector3(25, 0, 0) }, // Center of course
    { frame: 60, value: new Vector3(20, 0, 0) }, // Start moving toward tee
    { frame: 120, value: new Vector3(10, 0, 0) }, // Near tee
    { frame: 180, value: new Vector3(2, 0.5, 0) }, // Look at ball position
    { frame: 240, value: new Vector3(0, 0.5, 0) } // Focus on ball/tee for aiming
  ]
  targetAnimation.setKeys(targetKeys)
  
  // Apply easing for smooth motion
  const easingFunction = new CubicEase()
  easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT)
  alphaAnimation.setEasingFunction(easingFunction)
  betaAnimation.setEasingFunction(easingFunction)
  radiusAnimation.setEasingFunction(easingFunction)
  targetAnimation.setEasingFunction(easingFunction)
  
  // Apply animations to camera
  camera.animations = [alphaAnimation, betaAnimation, radiusAnimation, targetAnimation]
  
  // Start animation
  scene.beginAnimation(camera, 0, totalFrames, false, 1, onComplete)
}
