import React, { useRef, useEffect, useCallback } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  onFocus?: () => void;
}

export const EditableText: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Type here...',
  className = '',
  multiline = true,
  onFocus,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  // Sync external value changes without losing cursor position
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el !== document.activeElement && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (isComposingRef.current) return;
    const el = ref.current;
    if (el) onChange(el.textContent ?? '');
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
    }
  }, [multiline]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onCompositionStart={() => { isComposingRef.current = true; }}
      onCompositionEnd={() => {
        isComposingRef.current = false;
        handleInput();
      }}
      data-placeholder={placeholder}
      className={`outline-none min-w-0 break-words ${className} empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400`}
    />
  );
};
