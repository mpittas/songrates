/**
 * Shared page column: centered, 1180px max, with standard horizontal padding.
 * Use for section content (`MySection`) and any layout that cannot wrap in it.
 */
export const PAGE_CONTAINER = "mx-auto w-full max-w-[1180px] px-4 sm:px-6";

/**
 * Same max width as `PAGE_CONTAINER`, without horizontal padding.
 * Use for heroes and cards that should sit on the column edge.
 */
export const PAGE_CONTAINER_WIDTH = "mx-auto w-full max-w-[1180px]";

/**
 * Standard top padding for primary page content below the sticky header (`h-16`).
 * Use on the first full-width section (e.g. `MySection`) or the constrained column
 * in detail layouts so routes align visually.
 */
export const PAGE_CONTENT_TOP = "pt-10";
