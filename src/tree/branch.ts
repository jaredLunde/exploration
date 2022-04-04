import { Leaf } from "./leaf";

export class Branch<NodeData = {}> extends Leaf<NodeData> {
  public nodes?: Node<NodeData>[];
  /**
   * A flag indicating the "intended" expansion status of this branch. If this is `true`, the branch
   * is either already expanded OR is about to be expanded. Explained below.
   *
   * This value represents the "intended" expansion state not the "actual" expansion state. When
   * `Tree#expand` is called, the value of this will be immediately become `true`, however because
   * the child nodes of the branch in question might need to be loaded, the actual expansion won't
   * take effect until the children are loaded. So in that interim time while children are loading,
   * the branch isn't truly expanded even if the value is `true`.
   *
   * Depending on your use case you might want to rely on `Tree#isTrulyExpanded` for a "real-time" status.
   */
  public expanded: boolean;

  constructor(
    parent: Branch<NodeData> | null,
    data: NodeData,
    expanded = false
  ) {
    super(parent, data);
    this.expanded = expanded;
  }
}

export type Node<NodeData = {}> = Leaf<NodeData> | Branch<NodeData>;
