export function usePathname() {
  return "/home";
}
export function useSearchParams() {
  return new URLSearchParams(window.location.search);
}
