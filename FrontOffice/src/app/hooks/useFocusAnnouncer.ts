import { useEffect } from 'react';

/**
 * useFocusAnnouncer — WCAG 2.1.1 + Screen Reader simulation
 *
 * Listens to focus events on the document and reads the focused element
 * using the Web Speech API (same engine as TTSContext).
 *
 * What it reads (in priority order):
 *  1. aria-label attribute
 *  2. aria-labelledby → text of the referenced element
 *  3. title attribute
 *  4. placeholder attribute (inputs)
 *  5. textContent (trimmed, max 100 chars)
 *
 * Only active when the user is navigating with the keyboard (Tab key).
 * Mouse clicks do NOT trigger reading (avoids annoying behaviour).
 *
 * @param speak  - the speak() function from TTSContext
 * @param enabled - whether focus reading is enabled (user toggle)
 */
export function useFocusAnnouncer(
  speak: (text: string) => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    // Track whether the user is using keyboard navigation
    let usingKeyboard = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') usingKeyboard = true;
    };

    const onMouseDown = () => {
      usingKeyboard = false;
    };

    const onFocus = (e: FocusEvent) => {
      if (!usingKeyboard) return;

      const el = e.target as HTMLElement;
      if (!el) return;

      // Skip elements that are not interactive or visible
      if (el.tagName === 'BODY' || el.tagName === 'HTML') return;

      // Check if the focused element is inside a card/article with aria-label
      // If so, read the card context first (only when entering the card)
      const parentCard = el.closest('article[aria-label], [role="article"][aria-label]') as HTMLElement | null;
      if (parentCard) {
        const cardLabel = parentCard.getAttribute('aria-label');
        const elementName = getAccessibleName(el);
        // Read "card context — button name" so the user knows where they are
        if (cardLabel && elementName) {
          const text = `${cardLabel}. ${elementName}`;
          setTimeout(() => speak(text), 50);
          return;
        }
      }

      const text = getAccessibleName(el);
      if (text) {
        // Small delay so the element is fully rendered before speaking
        setTimeout(() => speak(text), 50);
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('focus', onFocus, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('focus', onFocus, true);
    };
  }, [speak, enabled]);
}

/**
 * Extracts the accessible name of an element following WCAG 4.1.2 priority:
 * aria-label > aria-labelledby > title > placeholder > textContent > role hint
 */
function getAccessibleName(el: HTMLElement): string {
  // 1. aria-label (explicit label)
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel?.trim()) return ariaLabel.trim();

  // 2. aria-labelledby (references another element's text)
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl?.textContent?.trim()) return labelEl.textContent.trim();
  }

  // 3. <label> associated via htmlFor / wrapping label
  if (el.id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const parentLabel = el.closest('label');
  if (parentLabel?.textContent?.trim()) {
    // Remove the input's own value from the label text
    return parentLabel.textContent.trim();
  }

  // 4. title attribute
  const title = el.getAttribute('title');
  if (title?.trim()) return title.trim();

  // 5. placeholder (inputs)
  const placeholder = el.getAttribute('placeholder');
  if (placeholder?.trim()) return placeholder.trim();

  // 6. textContent (buttons, links, headings) — max 120 chars
  const text = el.textContent?.trim();
  if (text) return text.slice(0, 120);

  // 7. Role hint as fallback
  const role = el.getAttribute('role') || el.tagName.toLowerCase();
  const roleHints: Record<string, string> = {
    button: 'bouton',
    link: 'lien',
    checkbox: 'case à cocher',
    radio: 'bouton radio',
    textbox: 'champ de texte',
    combobox: 'liste déroulante',
    dialog: 'fenêtre de dialogue',
    navigation: 'navigation',
    main: 'contenu principal',
  };
  return roleHints[role] ?? '';
}
