import { useRef, useEffect, KeyboardEvent } from 'react';

// Key codes for keyboard navigation
export const KeyCodes = {
  TAB: 'Tab',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  END: 'End',
  HOME: 'Home',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_UP: 'ArrowUp',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_DOWN: 'ArrowDown',
};

/**
 * Hook to handle keyboard navigation in lists (like dropdown menus, select options, etc.)
 * 
 * @param itemCount - Number of items in the list
 * @param onSelect - Callback when an item is selected
 * @param initialIndex - Initial focused index
 * @param loop - Whether to loop from last to first item and vice versa
 * @returns Object with current index and key handler
 */
export function useListKeyboardNavigation(
  itemCount: number,
  onSelect: (index: number) => void,
  initialIndex = -1,
  loop = true
) {
  const currentIndex = useRef(initialIndex);

  const handleKeyDown = (event: KeyboardEvent) => {
    let newIndex = currentIndex.current;

    switch (event.key) {
      case KeyCodes.ARROW_DOWN:
        event.preventDefault();
        if (newIndex < itemCount - 1) {
          newIndex += 1;
        } else if (loop) {
          newIndex = 0;
        }
        break;
        
      case KeyCodes.ARROW_UP:
        event.preventDefault();
        if (newIndex > 0) {
          newIndex -= 1;
        } else if (loop) {
          newIndex = itemCount - 1;
        }
        break;
        
      case KeyCodes.HOME:
        event.preventDefault();
        newIndex = 0;
        break;
        
      case KeyCodes.END:
        event.preventDefault();
        newIndex = itemCount - 1;
        break;
        
      case KeyCodes.ENTER:
      case KeyCodes.SPACE:
        event.preventDefault();
        if (newIndex >= 0) {
          onSelect(newIndex);
        }
        return;
        
      default:
        return;
    }

    if (newIndex !== currentIndex.current) {
      currentIndex.current = newIndex;
      // Focus the new item
      const element = document.getElementById(`list-item-${newIndex}`);
      if (element) {
        element.focus();
      }
    }
  };

  return {
    currentIndex: currentIndex.current,
    handleKeyDown,
  };
}

/**
 * Utility to set up keyboard navigation for a grid (like a calendar, data table, etc.)
 * 
 * @param rowCount - Number of rows in the grid
 * @param columnCount - Number of columns in the grid
 * @param onSelect - Callback when a cell is selected
 * @param initialRow - Initial focused row
 * @param initialColumn - Initial focused column
 * @returns Object with current position and key handler
 */
export function useGridKeyboardNavigation(
  rowCount: number,
  columnCount: number,
  onSelect: (row: number, column: number) => void,
  initialRow = 0,
  initialColumn = 0
) {
  const currentRow = useRef(initialRow);
  const currentColumn = useRef(initialColumn);

  const handleKeyDown = (event: KeyboardEvent) => {
    let newRow = currentRow.current;
    let newColumn = currentColumn.current;

    switch (event.key) {
      case KeyCodes.ARROW_DOWN:
        event.preventDefault();
        newRow = Math.min(newRow + 1, rowCount - 1);
        break;
        
      case KeyCodes.ARROW_UP:
        event.preventDefault();
        newRow = Math.max(newRow - 1, 0);
        break;
        
      case KeyCodes.ARROW_RIGHT:
        event.preventDefault();
        newColumn = Math.min(newColumn + 1, columnCount - 1);
        break;
        
      case KeyCodes.ARROW_LEFT:
        event.preventDefault();
        newColumn = Math.max(newColumn - 1, 0);
        break;
        
      case KeyCodes.HOME:
        event.preventDefault();
        if (event.ctrlKey) {
          newRow = 0;
          newColumn = 0;
        } else {
          newColumn = 0;
        }
        break;
        
      case KeyCodes.END:
        event.preventDefault();
        if (event.ctrlKey) {
          newRow = rowCount - 1;
          newColumn = columnCount - 1;
        } else {
          newColumn = columnCount - 1;
        }
        break;
        
      case KeyCodes.PAGE_UP:
        event.preventDefault();
        newRow = Math.max(newRow - 5, 0);
        break;
        
      case KeyCodes.PAGE_DOWN:
        event.preventDefault();
        newRow = Math.min(newRow + 5, rowCount - 1);
        break;
        
      case KeyCodes.ENTER:
      case KeyCodes.SPACE:
        event.preventDefault();
        onSelect(newRow, newColumn);
        return;
        
      default:
        return;
    }

    if (newRow !== currentRow.current || newColumn !== currentColumn.current) {
      currentRow.current = newRow;
      currentColumn.current = newColumn;
      
      // Focus the new cell
      const element = document.getElementById(`grid-cell-${newRow}-${newColumn}`);
      if (element) {
        element.focus();
      }
    }
  };

  return {
    currentPosition: { row: currentRow.current, column: currentColumn.current },
    handleKeyDown,
  };
}