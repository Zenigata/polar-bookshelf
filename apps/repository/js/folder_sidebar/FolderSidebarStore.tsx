import React from 'react';
import {Tags, TagStr, TagType} from "polar-shared/src/tags/Tags";
import {TRoot} from "../../../../web/js/ui/tree/TreeView";
import {TagDescriptor} from "polar-shared/src/tags/TagDescriptors";
import {
    createObservableStore,
    SetStore
} from "../../../../web/spectron0/material-ui/store/ObservableStore";
import {Provider} from "polar-shared/src/util/Providers";
import {useRepoDocInfos} from "../doc_repo/DocRepoHooks";
import {TagNodes} from "../../../../web/js/tags/TagNodes";
import isEqual from "react-fast-compare";
import {
    usePersistence,
    useTagsContext
} from "../persistence_layer/PersistenceLayerApp";
import {useTagSelector} from "../store/TagSelector";
import {FolderSelectionEvents} from "./FolderSelectionEvents";
import {useDialogManager} from "../../../../web/spectron0/material-ui/dialogs/MUIDialogControllers";
import {NULL_FUNCTION} from "polar-shared/src/util/Functions";
import {Paths} from "polar-shared/src/util/Paths";
import TagID = Tags.TagID;
import Selected = FolderSelectionEvents.Selected;
import SelfSelected = FolderSelectionEvents.SelfSelected;
import {Logger} from "polar-shared/src/logger/Logger";

const log = Logger.create();

export interface TagDescriptorSelected extends TagDescriptor {
    readonly selected: boolean
}

interface IFolderSidebarStore {

    /**
     * The filter of the current tags.
     */
    readonly filter: string;

    /**
     * The tags used to build the store. Used for rebuilding.
     */
    readonly tags: ReadonlyArray<TagDescriptor>;

    readonly tagsView: ReadonlyArray<TagDescriptor>;

    readonly foldersRoot: TRoot<TagDescriptorSelected> | undefined;

    /**
     * The state of selected nodes.
     */
    readonly selected: ReadonlyArray<TagID>;

    /**
     * The state of expanded nodes.
     */
    readonly expanded: ReadonlyArray<TagID>;

}

interface IFolderSidebarCallbacks {

    readonly selectRow: (node: TagID, event: React.MouseEvent, source: 'checkbox' | 'click') => void;

    readonly toggleExpanded: (nodes: ReadonlyArray<TagID>) => void;

    readonly collapseNode: (node: TagID) => void;

    readonly expandNode: (node: TagID) => void;

    readonly setFilter: (text: string) => void;

    readonly onCreateUserTag: (type: 'folder' | 'tag') => void;

}

const folderStore: IFolderSidebarStore = {
    filter: "",
    tags: [],
    tagsView: [],
    foldersRoot: undefined,
    selected: [],
    expanded: []
}

interface Mutation {
    readonly filter: string;
    readonly tags: ReadonlyArray<TagDescriptor>;
    readonly selected: ReadonlyArray<TagID>;
}

interface Mutator {

    readonly doUpdate: (mutation: Mutation) => void;

}

function mutatorFactory(storeProvider: Provider<IFolderSidebarStore>,
                        setStore: SetStore<IFolderSidebarStore>): Mutator {

    function reduce(mutation: Mutation): IFolderSidebarStore | undefined {

        const store = storeProvider();

        function computeFiltered(tags: ReadonlyArray<TagDescriptor>) {

            const filterPredicate = (tag: TagDescriptor) => {
                return tag.label.toLowerCase().indexOf(mutation.filter) !== -1
            }

            if (mutation.filter.trim() !== '') {
                return tags.filter(filterPredicate);
            }

            return tags;

        }

        function rebuildStore(tags: ReadonlyArray<TagDescriptor>): IFolderSidebarStore | undefined{

            const filtered = computeFiltered(tags);

            const tagsView = Tags.onlyRegular(filtered);

            function buildFoldersRoot() {

                function toTagDescriptorSelected(tag: TagDescriptor): TagDescriptorSelected {

                    return {
                        ...tag,
                        selected: mutation.selected.includes(tag.id)
                    };
                }

                const rawFoldersRoot = TagNodes.createFoldersRoot({tags: filtered, type: 'folder'});
                return TagNodes.decorate(rawFoldersRoot, toTagDescriptorSelected);

            }

            const foldersRoot = buildFoldersRoot();

            return {
                ...store,
                filter: mutation.filter,
                selected: mutation.selected,
                tags,
                tagsView,
                foldersRoot
            }

        }

        /**
         * Return true if our data has changed and needs to be reduced.
         */
        function hasChanged() {

            if (! isEqual(store.tags, tags)) {
                return true;
            }

            if (! isEqual(store.selected, mutation.selected)) {
                return true;
            }

            if (store.filter.trim() !== mutation.filter.trim()) {
                return true;
            }

            return false;

        }

        // always sort the tags so that if they change slightly we at least have a
        // deterministic layout.
        const tags = [...mutation.tags].sort((a, b) => b.count - a.count)

        if (hasChanged()) {
            return rebuildStore(tags);
        }

        return undefined;

    }

    function doUpdate(mutation: Mutation) {

        const newStore = reduce(mutation);

        if (newStore) {
            setStore(newStore);
        }

    }

    return {doUpdate};

}

function callbacksFactory(storeProvider: Provider<IFolderSidebarStore>,
                          setStore: (store: IFolderSidebarStore) => void,
                          mutator: Mutator): IFolderSidebarCallbacks {

    // used so that we listen to repoDocInfos and get them for every update
    // so that we can build a new store.
    //
    // TODO: This isn't an amazingly good way to listen for updates since we're
    // just trying to get the tagsContext working..
    const repoDocInfos = useRepoDocInfos();
    const tagsContext = useTagsContext();
    const tagSelector = useTagSelector();
    const dialogs = useDialogManager();
    const persistence = usePersistence();

    function doHookUpdate() {

        const store = storeProvider();

        const tags = tagsContext?.tagsProvider() || [];

        mutator.doUpdate({...store, tags});

    }

    doHookUpdate();

    function doSelectRow(nodes: ReadonlyArray<TagID>) {
        //
        // const store = storeProvider();

        // const selectedTags = Tags.lookupByTagLiteral(store.tags, nodes);
        tagSelector.onTagSelected(nodes);

    }

    function selectRow(node: TagID,
                       event: React.MouseEvent,
                       source: 'checkbox' | 'click'): void {

        const store = storeProvider();

        function toSelected(): Selected {

            if (store.selected.length > 1) {
                return 'multiple';
            } else if (store.selected.length === 1) {
                return 'single';
            } else {
                return 'none';
            }

        }

        function toSelfSelected(): SelfSelected {
            return store.selected.includes(node) ? 'yes' : 'no';
        }

        const eventType = FolderSelectionEvents.toEventType(event, source);
        const selected = toSelected();
        const selfSelected = toSelfSelected();

        const strategy = FolderSelectionEvents.toStrategy({eventType, selected, selfSelected});

        const newSelected = FolderSelectionEvents.executeStrategy(strategy, node, store.selected);

        mutator.doUpdate({...store, selected: newSelected});
        doSelectRow(newSelected);

    }

    function toggleExpanded(nodes: ReadonlyArray<TagID>): void {

        const store = storeProvider();

        // const expanded = doToggle(store.expanded, nodes);

        setStore({
            ...store,
            expanded: nodes
        });
    }

    function collapseNode(node: TagID) {

        console.log("FIXME collapseNode: ", node);

        const store = storeProvider();

        const expanded = [...store.expanded]
            .filter(current => current !== node);

        setStore({...store, expanded});

    }

    function expandNode(node: TagID) {

        const store = storeProvider();

        const expanded = [...store.expanded];

        if (! expanded.includes(node)) {
            expanded.push(node);
        }

        setStore({...store, expanded});

    }

    function setFilter(filter: string) {

        const store = storeProvider();

        // TODO: it might be nice if this was a state, which can be restore
        // after the filter but not sure about that
        mutator.doUpdate({...store, filter, selected: []});

    }

    function doCreateUserTag(userTag: string, type: TagType) {

        // FIXME: the context menu, for tags, MUST only create on the first
        // folder...

        const createNewTag = (): TagStr => {

            const store = storeProvider();
            const selectedTags = store.selected;

            switch (type) {
                case "tag":
                    return userTag;
                case "folder":
                    const parent = selectedTags.length > 0 ? selectedTags[0] : '/';
                    return Paths.create(parent, userTag);
            }

        };

        const newTag = createNewTag();

        async function doHandle() {

            const {persistenceLayerMutator} = persistence;
            await persistenceLayerMutator.createTag(newTag);

            dialogs.snackbar({message: `Tag '${newTag}' created successfully.`});

        }

        // FIXME: use dialogs.error here() if this fails
        doHandle()
            .catch(err => log.error("Unable to create tag: " + newTag, err));

    }

    function onCreateUserTag(type: TagType) {

        dialogs.prompt({
            title: "Create new " + type,
            description: "May not create spaces and some extended unicode characters.",
            autoFocus: true,
            onCancel: NULL_FUNCTION,
            onDone: (text) => doCreateUserTag(text, type)
        });

    }

    return {
        toggleExpanded, collapseNode, expandNode, setFilter, selectRow, onCreateUserTag
    };

}

export function createFolderSidebarStore() {
    return createObservableStore<IFolderSidebarStore, Mutator, IFolderSidebarCallbacks>({
          initialValue: folderStore,
          mutatorFactory,
          callbacksFactory
    });
}

export const [FolderSidebarStoreProvider, useFolderSidebarStore, useFolderSidebarCallbacks]
    = createFolderSidebarStore();

interface IProps {
    readonly children: JSX.Element;
}

export const FolderSidebarStore = (props: IProps) => {

    return (
        <FolderSidebarStoreProvider>
            {props.children}
        </FolderSidebarStoreProvider>
    )

}