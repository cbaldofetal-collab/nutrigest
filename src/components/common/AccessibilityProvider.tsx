import React, { useEffect, useState } from 'react';

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

interface AccessibilityContextType {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  screenReaderMode: boolean;
  toggleHighContrast: () => void;
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
  toggleScreenReaderMode: () => void;
  announce: (message: string) => void;
}

export const AccessibilityContext = React.createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Load preferences from localStorage
    const savedHighContrast = localStorage.getItem('glicogest-high-contrast') === 'true';
    const savedFontSize = localStorage.getItem('glicogest-font-size') as 'normal' | 'large' | 'extra-large';
    const savedScreenReaderMode = localStorage.getItem('glicogest-screen-reader') === 'true';

    setHighContrast(savedHighContrast);
    setFontSize(savedFontSize || 'normal');
    setScreenReaderMode(savedScreenReaderMode);
  }, []);

  useEffect(() => {
    // Apply high contrast mode
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    localStorage.setItem('glicogest-high-contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    // Apply font size
    document.documentElement.classList.remove('text-base', 'text-lg', 'text-xl');
    if (fontSize === 'large') {
      document.documentElement.classList.add('text-lg');
    } else if (fontSize === 'extra-large') {
      document.documentElement.classList.add('text-xl');
    } else {
      document.documentElement.classList.add('text-base');
    }
    localStorage.setItem('glicogest-font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    // Apply screen reader mode
    if (screenReaderMode) {
      document.documentElement.classList.add('screen-reader-mode');
      // Add ARIA attributes
      document.documentElement.setAttribute('role', 'application');
      document.documentElement.setAttribute('aria-label', 'GlicoGest - Monitoramento de Diabetes Gestacional');
    } else {
      document.documentElement.classList.remove('screen-reader-mode');
      document.documentElement.removeAttribute('role');
      document.documentElement.removeAttribute('aria-label');
    }
    localStorage.setItem('glicogest-screen-reader', String(screenReaderMode));
  }, [screenReaderMode]);

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const handleSetFontSize = (size: 'normal' | 'large' | 'extra-large') => {
    setFontSize(size);
  };

  const toggleScreenReaderMode = () => {
    setScreenReaderMode(prev => !prev);
  };

  const announce = (message: string) => {
    setAnnouncement(message);
    // Clear announcement after screen readers have time to read it
    setTimeout(() => setAnnouncement(''), 1000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        fontSize,
        screenReaderMode,
        toggleHighContrast,
        setFontSize: handleSetFontSize,
        toggleScreenReaderMode,
        announce,
      }}
    >
      {children}
      {/* Screen reader announcement area */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Accessibility utilities
export const focusNextElement = (currentElement: HTMLElement) => {
  const focusableElements = Array.from(
    document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ) as HTMLElement[];
  
  const currentIndex = focusableElements.indexOf(currentElement);
  const nextElement = focusableElements[currentIndex + 1] || focusableElements[0];
  
  if (nextElement) {
    nextElement.focus();
  }
};

export const focusPreviousElement = (currentElement: HTMLElement) => {
  const focusableElements = Array.from(
    document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ) as HTMLElement[];
  
  const currentIndex = focusableElements.indexOf(currentElement);
  const previousElement = focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
  
  if (previousElement) {
    previousElement.focus();
  }
};

// Keyboard navigation hook
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Arrow key navigation
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          focusNextElement(activeElement);
          event.preventDefault();
        }
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          focusPreviousElement(activeElement);
          event.preventDefault();
        }
      }
      
      // Escape key to close modals/dropdowns
      if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
        const openDropdowns = document.querySelectorAll('[role="listbox"]:not([hidden])');
        
        if (openModals.length > 0) {
          const closeButton = openModals[openModals.length - 1].querySelector('[data-close]') as HTMLButtonElement;
          if (closeButton) {
            closeButton.click();
          }
        } else if (openDropdowns.length > 0) {
          (openDropdowns[openDropdowns.length - 1] as HTMLElement).setAttribute('hidden', 'true');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};

// Focus management hook
export const useFocusManagement = (ref: React.RefObject<HTMLElement>, shouldFocus: boolean) => {
  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus();
    }
  }, [shouldFocus, ref]);
};

// ARIA live region for dynamic content
export const AriaLiveRegion: React.FC<{ message: string; priority?: 'polite' | 'assertive' }> = ({ 
  message, 
  priority = 'polite' 
}) => {
  return (
    <div
      className="sr-only"
      role="status"
      aria-live={priority}
      aria-atomic="true"
    >
      {message}
    </div>
  );
};

// Skip to main content link
export const SkipToMainContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
    >
      Pular para o conteúdo principal
    </a>
  );
};

export default AccessibilityProvider;