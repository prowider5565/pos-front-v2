#!/bin/bash
# Wrapper script to run Tauri dev without snap library interference

# Run with completely clean library path environment
exec env -i \
  HOME="$HOME" \
  USER="$USER" \
  PATH="$PATH" \
  TERM="$TERM" \
  SHELL="$SHELL" \
  PWD="$PWD" \
  DISPLAY="$DISPLAY" \
  WAYLAND_DISPLAY="$WAYLAND_DISPLAY" \
  XDG_RUNTIME_DIR="$XDG_RUNTIME_DIR" \
  DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION_BUS_ADDRESS" \
  npx tauri dev
