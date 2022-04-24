/// <reference types="react" />
export declare type WindowRef = Window | React.MutableRefObject<HTMLElement | null> | HTMLElement | null;
export declare type FileTreeSnapshot = {
    /**
     * The expanded paths of the file tree.
     */
    expandedPaths: string[];
    /**
     * The buried paths of the file tree. That is, directories that are expanded
     * but not visible.
     */
    buriedPaths: string[];
    /**
     * The version of the snapshot schema.
     */
    version: 1;
};
