// theme.js: EUISS palette and shared chart settings

export const theme = {
  // palette
  teal: "#309ebe",
  fuchsia: "#df3144",
  navy: "#113655",
  orange: "#f28d22",
  grey: "#595959",
  light: "#c6c6c6",
  nearWhite: "#f9f9f9",
  ink: "#1d1d1b",
  muted: "#646363",

  // maps: white land with light-grey outlines on the page background
  land: "#ffffff",
  border: "#c6c6c6",

  font: "'PT Sans Narrow', 'Arial Narrow', sans-serif",

  // dimmed items keep their own colour at this opacity
  dim: 0.2,

  // transition length in ms (0 when the reader prefers reduced motion)
  duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700,
};
