import { beforeEach, describe, expect, it } from 'vitest'
import catalog from '../data/catalog'
import { useStore } from './useStore'

function defFor(type: string) {
  const def = catalog.find((item) => item.type === type)
  if (!def) throw new Error(`Missing catalog entry for ${type}`)
  return def
}

describe('useStore actions', () => {
  beforeEach(() => {
    useStore.getState().clear()
    useStore.setState({ past: [], future: [], canUndo: false, canRedo: false, exportLayout: 'modular' })
  })

  it('supports undo and redo across node mutations', () => {
    const store = useStore.getState()
    store.addNode(defFor('aws_vpc'), { x: 40, y: 80 })
    expect(useStore.getState().nodes).toHaveLength(1)
    expect(useStore.getState().canUndo).toBe(true)

    useStore.getState().undo()
    expect(useStore.getState().nodes).toHaveLength(0)
    expect(useStore.getState().canRedo).toBe(true)

    useStore.getState().redo()
    expect(useStore.getState().nodes).toHaveLength(1)
  })

  it('duplicates the selected node and preserves handle IDs on connect and reconnect', () => {
    useStore.getState().addNode(defFor('aws_vpc'), { x: 0, y: 0 })
    const vpcId = useStore.getState().nodes[0].id
    useStore.getState().addNode(defFor('aws_subnet'), { x: 240, y: 0 })
    const subId = useStore.getState().nodes[1].id

    useStore.getState().setSelectedNode(subId)
    useStore.getState().duplicateSelected()
    expect(useStore.getState().nodes).toHaveLength(3)

    useStore.getState().onConnect({
      source: subId,
      target: vpcId,
      sourceHandle: 'top',
      targetHandle: 'top',
    })

    const createdEdge = useStore.getState().edges[0]
    expect(createdEdge.sourceHandle).toBe('top')
    expect(createdEdge.targetHandle).toBe('top')

    useStore.getState().onReconnect(createdEdge, {
      source: subId,
      target: vpcId,
      sourceHandle: 'left',
      targetHandle: 'right',
    })

    const updatedEdge = useStore.getState().edges[0]
    expect(updatedEdge.sourceHandle).toBe('left')
    expect(updatedEdge.targetHandle).toBe('right')
  })

  it('autoLayout arranges nodes cleanly by infrastructure tier', () => {
    useStore.getState().addNode(defFor('aws_ec2_instance'), { x: 0, y: 0 })
    useStore.getState().addNode(defFor('aws_vpc'), { x: 0, y: 0 })
    useStore.getState().addNode(defFor('aws_rds_instance'), { x: 0, y: 0 })

    useStore.getState().autoLayout()
    const byType = Object.fromEntries(useStore.getState().nodes.map((n) => [n.data.resourceType, n.position.x]))

    expect(byType.aws_vpc).toBeLessThan(byType.aws_ec2_instance)
    expect(byType.aws_ec2_instance).toBeLessThan(byType.aws_rds_instance)
  })

  it('toggles exportLayout and imports Terraform HCL files onto canvas', () => {
    useStore.getState().setExportLayout('single')
    expect(useStore.getState().toProject().exportLayout).toBe('single')

    useStore.getState().importTerraform([
      {
        name: 'network.tf',
        content: `
resource "aws_vpc" "main" {
  cidr_block = "10.5.0.0/16"
}
resource "aws_subnet" "app" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.5.1.0/24"
}
`,
      },
    ])

    expect(useStore.getState().nodes).toHaveLength(2)
    expect(useStore.getState().edges).toHaveLength(1)
  })
})
