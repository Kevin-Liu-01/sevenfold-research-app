from typing import List

from dto.files_types import ( 
    FileTreeNode,
    FileRecord
)

def build_file_tree(file_list: List[FileRecord]) -> List[FileTreeNode]:
    """Builds a hierarchical file tree from a flat list of file records."""
    file_dict = dict()
    tree = []

    # First, create all nodes and store them in a dictionary
    for file in file_list:
        node = FileTreeNode(**file.model_dump(), children=[])
        file_dict[file.id] = node

    # Then, link nodes to their parents. If no parent, it's a root node.
    for file in file_list:
        if file.parent_id is None:
            tree.append(file_dict[file.id])
        else:
            file_dict[file.parent_id].children.append(file_dict[file.id])

    tree.sort(key=lambda x: x.asset_type=="folder", reverse=True)

    return tree
