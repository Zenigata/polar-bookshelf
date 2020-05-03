import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import {TagNode} from "../../../js/tags/TagNode";
import {TagDescriptor} from "polar-shared/src/tags/TagDescriptors";
import {MUITreeItem} from "./MUITreeItem";
import {NULL_FUNCTION} from "polar-shared/src/util/Functions";
import isEqual from "react-fast-compare";
import {TagDescriptorSelected} from "../../../../apps/repository/js/folder_sidebar/FolderSidebarStore";
import {Tags} from "polar-shared/src/tags/Tags";
import TagID = Tags.TagID;

export type NodeSelectToggleType = 'click' | 'checkbox';

interface IProps {
    readonly root: TagNode<TagDescriptorSelected>;
    readonly toggleExpanded: (nodes: ReadonlyArray<string>) => void;
    readonly selectRow: (node: TagID, event: React.MouseEvent, source: 'checkbox' | 'click') => void;

    readonly collapseNode: (node: string) => void;
    readonly expandNode: (node: string) => void;

    readonly selected: ReadonlyArray<string>;
    readonly expanded: ReadonlyArray<string>;
}

export const MUITreeView = React.memo((props: IProps) => {

    return (
        <TreeView selected={[]}
                  expanded={[...props.expanded]}>

            <MUITreeItem nodeId={props.root.id}
                         label="Folders"
                         info={props.root.value.count}
                         selected={props.root.value.selected}
                         onNodeExpand={props.expandNode}
                         onNodeCollapse={props.collapseNode}
                         selectRow={props.selectRow}
                         childNodes={props.root.children}/>

        </TreeView>
    );
}, isEqual);