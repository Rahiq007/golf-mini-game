import { Vector3, Scene, MeshBuilder, StandardMaterial, Color3, ShadowGenerator, Mesh } from "@babylonjs/core"
import { HARD_PHYSICS_CONFIG, DIFFICULTY_MULTIPLIERS } from "./physicsConfig"

export interface CourseConfig {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  holeDistance: number
  holePosition: Vector3
  holeDiameter: number // Smaller = harder
  windStrength: number
  fairwayWidth: number
  bunkers: Array<{ position: Vector3, diameter: number }>
  trees: Array<{ position: Vector3 }>
  theme: {
    groundColor: Color3
    fairwayColor: Color3
    greenColor: Color3
  }
}

export const GOLF_COURSES: CourseConfig[] = [
  {
    id: 'augusta',
    name: 'Augusta Hills',
    difficulty: 'medium',
    holeDistance: 45,
    holePosition: new Vector3(45, 0, 0),
    holeDiameter: 0.35, // Medium difficulty
    windStrength: 2,
    fairwayWidth: 5,
    bunkers: [
      { position: new Vector3(20, 0.025, -6), diameter: 6 },
      { position: new Vector3(35, 0.025, 7), diameter: 5 },
      { position: new Vector3(40, 0.025, -3), diameter: 4 }
    ],
    trees: [
      { position: new Vector3(10, 0, 12) },
      { position: new Vector3(25, 0, 13) },
      { position: new Vector3(40, 0, 12) },
      { position: new Vector3(10, 0, -12) },
      { position: new Vector3(25, 0, -13) },
      { position: new Vector3(40, 0, -12) },
      { position: new Vector3(55, 0, 8) },
      { position: new Vector3(55, 0, -8) }
    ],
    theme: {
      groundColor: new Color3(0.15, 0.45, 0.15),
      fairwayColor: new Color3(0.3, 0.65, 0.3),
      greenColor: new Color3(0.38, 0.75, 0.38)
    }
  },
  {
    id: 'desert_dunes',
    name: 'Desert Dunes',
    difficulty: 'hard',
    holeDistance: 50,
    holePosition: new Vector3(50, 0, 2), // Slightly off-center
    holeDiameter: 0.25, // Smaller hole - harder
    windStrength: 4, // More wind
    fairwayWidth: 4, // Narrower fairway
    bunkers: [
      { position: new Vector3(15, 0.025, -4), diameter: 7 },
      { position: new Vector3(25, 0.025, 5), diameter: 8 },
      { position: new Vector3(35, 0.025, -6), diameter: 6 },
      { position: new Vector3(42, 0.025, 3), diameter: 5 },
      { position: new Vector3(45, 0.025, -8), diameter: 4 }
    ],
    trees: [
      { position: new Vector3(8, 0, 10) },
      { position: new Vector3(20, 0, -11) },
      { position: new Vector3(32, 0, 12) },
      { position: new Vector3(45, 0, -10) },
      { position: new Vector3(52, 0, 7) }
    ],
    theme: {
      groundColor: new Color3(0.6, 0.5, 0.3), // Sandy color
      fairwayColor: new Color3(0.25, 0.5, 0.25), // Sparse grass
      greenColor: new Color3(0.35, 0.65, 0.35)
    }
  },
  {
    id: 'links_coast',
    name: 'Links Coastal',
    difficulty: 'hard',
    holeDistance: 48,
    holePosition: new Vector3(48, 0, -3),
    holeDiameter: 0.28,
    windStrength: 5, // Heavy coastal wind
    fairwayWidth: 3.5, // Very narrow
    bunkers: [
      { position: new Vector3(18, 0.025, 0), diameter: 5 },
      { position: new Vector3(28, 0.025, -5), diameter: 6 },
      { position: new Vector3(38, 0.025, 4), diameter: 7 },
      { position: new Vector3(44, 0.025, -6), diameter: 4 }
    ],
    trees: [
      { position: new Vector3(12, 0, -10) },
      { position: new Vector3(24, 0, 11) },
      { position: new Vector3(36, 0, -9) },
      { position: new Vector3(50, 0, 10) }
    ],
    theme: {
      groundColor: new Color3(0.2, 0.4, 0.2), // Dark seaside grass
      fairwayColor: new Color3(0.28, 0.55, 0.28),
      greenColor: new Color3(0.4, 0.7, 0.4)
    }
  },
  {
    id: 'mountain_peak',
    name: 'Mountain Peak',
    difficulty: 'medium',
    holeDistance: 42,
    holePosition: new Vector3(42, 0.5, 1), // Elevated hole
    holeDiameter: 0.32,
    windStrength: 3,
    fairwayWidth: 4.5,
    bunkers: [
      { position: new Vector3(20, 0.025, -3), diameter: 5 },
      { position: new Vector3(30, 0.025, 6), diameter: 6 },
      { position: new Vector3(38, 0.025, -4), diameter: 4 }
    ],
    trees: [
      { position: new Vector3(8, 0, 14) },
      { position: new Vector3(16, 0, -13) },
      { position: new Vector3(28, 0, 15) },
      { position: new Vector3(35, 0, -14) },
      { position: new Vector3(45, 0, 12) },
      { position: new Vector3(48, 0, -11) }
    ],
    theme: {
      groundColor: new Color3(0.18, 0.38, 0.18), // Mountain grass
      fairwayColor: new Color3(0.32, 0.62, 0.32),
      greenColor: new Color3(0.42, 0.72, 0.42)
    }
  }
]

export class CourseManager {
  private currentCourse: CourseConfig
  private courseBuilt: boolean = false

  constructor() {
    // Select a random course
    this.currentCourse = this.selectRandomCourse()
    console.log('[COURSE] Selected course:', this.currentCourse.name, 'Difficulty:', this.currentCourse.difficulty)
  }

  selectRandomCourse(): CourseConfig {
    const randomIndex = Math.floor(Math.random() * GOLF_COURSES.length)
    return GOLF_COURSES[randomIndex]
  }

  getCurrentCourse(): CourseConfig {
    return this.currentCourse
  }
  
  getPhysicsConfig() {
    // Return the harder physics config with course-specific adjustments
    const multipliers = DIFFICULTY_MULTIPLIERS[this.currentCourse.difficulty]
    
    return {
      ...HARD_PHYSICS_CONFIG,
      // Apply difficulty multipliers
      friction: HARD_PHYSICS_CONFIG.friction * multipliers.friction,
      windMaxMagnitude: HARD_PHYSICS_CONFIG.windMaxMagnitude * multipliers.windMaxMagnitude,
      airResistance: HARD_PHYSICS_CONFIG.airResistance * multipliers.airResistance,
      rollResistance: HARD_PHYSICS_CONFIG.rollResistance * multipliers.rollResistance,
      // Convert Vector3 to Vector2D for physics (x,z -> x,y)
      holePosition: { 
        x: this.currentCourse.holePosition.x, 
        y: this.currentCourse.holePosition.z 
      },
      // Use base radius for hole detection - if ball is inside, it wins!
      holeRadius: (this.currentCourse.holeDiameter / 2) * multipliers.holeRadius
    }
  }

  buildCourse(scene: Scene, shadowGenerator: ShadowGenerator): void {
    if (this.courseBuilt) return
    
    const course = this.currentCourse
    
    // Build bunkers
    course.bunkers.forEach((bunkerConfig, index) => {
      const bunker = MeshBuilder.CreateCylinder(`bunker${index}`, { 
        height: 0.05, 
        diameter: bunkerConfig.diameter 
      }, scene)
      bunker.position = bunkerConfig.position
      
      const bunkerMaterial = new StandardMaterial(`bunkerMat${index}`, scene)
      bunkerMaterial.diffuseColor = new Color3(0.9, 0.8, 0.6) // Sand color
      bunkerMaterial.specularColor = new Color3(0.1, 0.1, 0.1)
      bunker.material = bunkerMaterial
    })
    
    // Build trees
    course.trees.forEach((treeConfig, index) => {
      const tree = this.createTree(scene, `tree${index}`)
      tree.position = treeConfig.position
      shadowGenerator.addShadowCaster(tree)
    })
    
    // Add distance markers
    const markerInterval = 10
    const numMarkers = Math.floor(course.holeDistance / markerInterval)
    
    for (let i = 1; i <= numMarkers; i++) {
      const dist = i * markerInterval
      const marker = MeshBuilder.CreateBox(`marker${dist}`, { 
        width: 0.5, 
        height: 1, 
        depth: 0.1 
      }, scene)
      marker.position = new Vector3(dist, 0.5, -10)
      
      const markerMat = new StandardMaterial(`markerMat${dist}`, scene)
      markerMat.diffuseColor = new Color3(1, 1, 1)
      markerMat.emissiveColor = new Color3(0.2, 0.2, 0.2)
      marker.material = markerMat
    }
    
    this.courseBuilt = true
  }

  private createTree(scene: Scene, name: string): Mesh {
    const trunk = MeshBuilder.CreateCylinder(`${name}_trunk`, { 
      height: 4, 
      diameter: 0.4 
    }, scene)
    
    const trunkMaterial = new StandardMaterial(`${name}_trunkMat`, scene)
    trunkMaterial.diffuseColor = new Color3(0.35, 0.2, 0.1)
    trunkMaterial.specularColor = new Color3(0.1, 0.1, 0.1)
    trunk.material = trunkMaterial
    trunk.position.y = 2
    
    const foliage = MeshBuilder.CreateSphere(`${name}_foliage`, { 
      diameter: 3, 
      segments: 8 
    }, scene)
    
    const foliageMaterial = new StandardMaterial(`${name}_foliageMat`, scene)
    foliageMaterial.diffuseColor = new Color3(0.1, 0.35, 0.1)
    foliageMaterial.specularColor = new Color3(0.05, 0.05, 0.05)
    foliage.material = foliageMaterial
    foliage.position.y = 4.5
    
    const tree = Mesh.MergeMeshes([trunk, foliage], true, true, undefined, false, true)
    if (tree) {
      tree.name = name
      return tree
    }
    return trunk
  }

  // Get adjusted physics config for current course difficulty
  getPhysicsAdjustments(): any {
    const adjustments = {
      easy: { 
        windMultiplier: 0.8, 
        frictionMultiplier: 0.9,
        holeRadiusMultiplier: 1.2 
      },
      medium: { 
        windMultiplier: 1.0, 
        frictionMultiplier: 1.0,
        holeRadiusMultiplier: 1.0 
      },
      hard: { 
        windMultiplier: 1.3, 
        frictionMultiplier: 1.1,
        holeRadiusMultiplier: 0.8 
      }
    }
    
    return adjustments[this.currentCourse.difficulty]
  }
}
