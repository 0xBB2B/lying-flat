// T051: 响应式断点 Hook
import { ref, onMounted, onUnmounted, computed } from 'vue'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

/**
 * 响应式断点配置 (基于 TailwindCSS 默认断点)
 */
const breakpoints = {
  mobile: 0,
  tablet: 768, // md
  desktop: 1024, // lg
}

/**
 * 响应式断点 Hook
 *
 * 提供当前屏幕断点和便捷的布尔状态
 *
 * @example
 * ```ts
 * const { breakpoint, isMobile, isTablet, isDesktop } = useResponsive()
 * ```
 */
export function useResponsive() {
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

  const updateWidth = () => {
    windowWidth.value = window.innerWidth
  }

  onMounted(() => {
    updateWidth()
    window.addEventListener('resize', updateWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth)
  })

  const breakpoint = computed<Breakpoint>(() => {
    const width = windowWidth.value
    if (width < breakpoints.tablet) return 'mobile'
    if (width < breakpoints.desktop) return 'tablet'
    return 'desktop'
  })

  const isMobile = computed(() => breakpoint.value === 'mobile')
  const isTablet = computed(() => breakpoint.value === 'tablet')
  const isDesktop = computed(() => breakpoint.value === 'desktop')
  const isMobileOrTablet = computed(() => isMobile.value || isTablet.value)

  return {
    windowWidth,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
  }
}
