import { useRef, useEffect } from 'react';
import { logger, DEBUG_CATEGORIES } from '@/shared/lib/utils/logger';

/**
 * Hook to track component render count
 * ใช้เพื่อ debug ว่า component render กี่ครั้ง และทำไม
 *
 * @example
 * function MyComponent(props) {
 *   useRenderCount('MyComponent', props);
 *   return <div>...</div>
 * }
 */
export function useRenderCount(componentName: string, props?: any) {
  const renderCount = useRef(0);
  const prevProps = useRef(props);

  useEffect(() => {
    renderCount.current += 1;

    // แสดงว่า render ครั้งที่เท่าไร
    logger.debug(
      DEBUG_CATEGORIES.RENDER,
      `${componentName} rendered #${renderCount.current}`
    );

    // ถ้ามี props แสดงว่า props ไหนเปลี่ยน
    if (props && prevProps.current) {
      const changedProps: string[] = [];
      Object.keys(props).forEach((key) => {
        if (props[key] !== prevProps.current?.[key]) {
          changedProps.push(key);
        }
      });

      if (changedProps.length > 0) {
        logger.debug(
          DEBUG_CATEGORIES.RENDER,
          `${componentName} props changed:`,
          changedProps
        );
      }
    }

    prevProps.current = props;
  });
}

/**
 * Hook to detect why component re-rendered
 * แสดงรายละเอียดว่า props/state ไหนเปลี่ยน
 *
 * @example
 * function MyComponent(props) {
 *   useWhyDidYouUpdate('MyComponent', props);
 *   return <div>...</div>
 * }
 */
export function useWhyDidYouUpdate(componentName: string, props: any) {
  const previousProps = useRef<any>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        logger.group(`${componentName} - Props Changed`);
        logger.debug(DEBUG_CATEGORIES.RENDER, 'Changed props:', changedProps);
        logger.groupEnd();
      }
    }

    previousProps.current = props;
  });
}
