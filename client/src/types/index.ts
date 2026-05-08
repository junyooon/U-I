export interface GraphNode {
  id: string
  name: string
  category_ids: string[]
  primary_color: string
  distance: number
  last_contact_at: string | null
  drift_velocity: number
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface GraphData {
  center: { id: string; name: string }
  nodes: GraphNode[]
  categories: Category[]
}
