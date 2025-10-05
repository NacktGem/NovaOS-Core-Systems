// ResponsiveGrid component - no React hooks needed
import './ResponsiveGrid.css';

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type GridSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AlignContent = 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around';
export type JustifyContent = 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around';

interface ResponsiveGridProps {
  children: React.ReactNode;
  container?: boolean;
  item?: boolean;
  spacing?: GridSpacing;
  direction?: 'row' | 'column';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  alignItems?: AlignContent;
  alignContent?: AlignContent;
  justifyContent?: JustifyContent;

  // Responsive columns for container
  xs?: GridColumns | 'auto' | true;
  sm?: GridColumns | 'auto' | true;
  md?: GridColumns | 'auto' | true;
  lg?: GridColumns | 'auto' | true;
  xl?: GridColumns | 'auto' | true;
  xxl?: GridColumns | 'auto' | true;

  // Responsive sizing for items
  itemXs?: GridColumns | 'auto';
  itemSm?: GridColumns | 'auto';
  itemMd?: GridColumns | 'auto';
  itemLg?: GridColumns | 'auto';
  itemXl?: GridColumns | 'auto';
  itemXxl?: GridColumns | 'auto';

  className?: string;
  style?: React.CSSProperties;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  container = false,
  item = false,
  spacing = 'md',
  direction = 'row',
  wrap = 'wrap',
  alignItems = 'stretch',
  alignContent = 'start',
  justifyContent = 'start',
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  itemXs,
  itemSm,
  itemMd,
  itemLg,
  itemXl,
  itemXxl,
  className = '',
  style = {}
}) => {
  const getClassNames = () => {
    const classes = ['responsive-grid'];

    if (container) {
      classes.push('responsive-grid--container');
      classes.push(`responsive-grid--spacing-${spacing}`);
      classes.push(`responsive-grid--direction-${direction}`);
      classes.push(`responsive-grid--wrap-${wrap}`);
      classes.push(`responsive-grid--align-items-${alignItems}`);
      classes.push(`responsive-grid--align-content-${alignContent}`);
      classes.push(`responsive-grid--justify-${justifyContent}`);

      // Add responsive column classes for containers
      if (xs !== undefined) classes.push(`responsive-grid--xs-${xs}`);
      if (sm !== undefined) classes.push(`responsive-grid--sm-${sm}`);
      if (md !== undefined) classes.push(`responsive-grid--md-${md}`);
      if (lg !== undefined) classes.push(`responsive-grid--lg-${lg}`);
      if (xl !== undefined) classes.push(`responsive-grid--xl-${xl}`);
      if (xxl !== undefined) classes.push(`responsive-grid--xxl-${xxl}`);
    }

    if (item) {
      classes.push('responsive-grid--item');

      // Add responsive sizing classes for items
      if (itemXs !== undefined) classes.push(`responsive-grid--item-xs-${itemXs}`);
      if (itemSm !== undefined) classes.push(`responsive-grid--item-sm-${itemSm}`);
      if (itemMd !== undefined) classes.push(`responsive-grid--item-md-${itemMd}`);
      if (itemLg !== undefined) classes.push(`responsive-grid--item-lg-${itemLg}`);
      if (itemXl !== undefined) classes.push(`responsive-grid--item-xl-${itemXl}`);
      if (itemXxl !== undefined) classes.push(`responsive-grid--item-xxl-${itemXxl}`);
    }

    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  };

  return (
    <div className={getClassNames()} style={style}>
      {children}
    </div>
  );
};

// Specialized components for common layouts

interface MobileCardGridProps {
  children: React.ReactNode;
  spacing?: GridSpacing;
  minCardWidth?: number;
  maxColumns?: GridColumns;
  className?: string;
}

export const MobileCardGrid: React.FC<MobileCardGridProps> = ({
  children,
  spacing = 'md',
  minCardWidth = 280,
  maxColumns = 4,
  className = ''
}) => {
  const style = {
    '--min-card-width': `${minCardWidth}px`,
    '--max-columns': maxColumns
  } as React.CSSProperties;

  return (
    <ResponsiveGrid
      container
      spacing={spacing}
      className={`mobile-card-grid ${className}`}
      style={style}
    >
      {children}
    </ResponsiveGrid>
  );
};

interface ResponsiveListProps {
  children: React.ReactNode;
  orientation?: 'vertical' | 'horizontal';
  spacing?: GridSpacing;
  dividers?: boolean;
  className?: string;
}

export const ResponsiveList: React.FC<ResponsiveListProps> = ({
  children,
  orientation = 'vertical',
  spacing = 'sm',
  dividers = false,
  className = ''
}) => {
  const classes = [
    'responsive-list',
    `responsive-list--${orientation}`,
    `responsive-list--spacing-${spacing}`,
    dividers ? 'responsive-list--dividers' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

interface MobileStackProps {
  children: React.ReactNode;
  spacing?: GridSpacing;
  direction?: 'column' | 'row';
  breakpoint?: BreakpointSize;
  reverseOnMobile?: boolean;
  className?: string;
}

export const MobileStack: React.FC<MobileStackProps> = ({
  children,
  spacing = 'md',
  direction = 'column',
  breakpoint = 'sm',
  reverseOnMobile = false,
  className = ''
}) => {
  const classes = [
    'mobile-stack',
    `mobile-stack--${direction}`,
    `mobile-stack--spacing-${spacing}`,
    `mobile-stack--breakpoint-${breakpoint}`,
    reverseOnMobile ? 'mobile-stack--reverse-mobile' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

interface TouchFriendlyContainerProps {
  children: React.ReactNode;
  padding?: GridSpacing;
  touchOptimized?: boolean;
  scrollable?: boolean;
  className?: string;
}

export const TouchFriendlyContainer: React.FC<TouchFriendlyContainerProps> = ({
  children,
  padding = 'md',
  touchOptimized = true,
  scrollable = false,
  className = ''
}) => {
  const classes = [
    'touch-container',
    `touch-container--padding-${padding}`,
    touchOptimized ? 'touch-container--optimized' : '',
    scrollable ? 'touch-container--scrollable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

// Hook for responsive behavior
export const useResponsiveBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<BreakpointSize>('xs');

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= 1400) setBreakpoint('xxl');
      else if (width >= 1200) setBreakpoint('xl');
      else if (width >= 992) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else if (width >= 576) setBreakpoint('sm');
      else setBreakpoint('xs');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};

// Utility hook for touch detection
export const useTouch = () => {
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });

    return () => window.removeEventListener('touchstart', checkTouch);
  }, []);

  return isTouch;
};

// Utility hook for safe area insets
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = React.useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  React.useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);

      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0', 10)
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
};

export default ResponsiveGrid;