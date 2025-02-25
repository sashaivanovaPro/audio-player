# Audio Player Project

A web-based audio player built with Object-Oriented Programming principles in JavaScript.

## Current Features

This OOP implementation represents a complete architectural restructuring of the code base:

- **Separation of Concerns** - Logic divided into distinct responsibility areas
- **Class-Based Architecture** - Using ES6 classes for better code organization
- **Centralized State Management** - Global player state handling
- **Enhanced Maintainability** - Each component has a single responsibility
- **Improved Extensibility** - Easier to add new features

### Core Components:

- **AudioController** - Handles all audio playback logic and state changes
- **UIController** - Manages the user interface and DOM interactions
- **TimeManagement** - Utility class for time-related operations
- **App** - Initialization and component interactions
- **PlayerState** - Central store for application data

### Functional Features:

- All previous vanilla JS functionality
- Advanced playback modes:
  - Repeat all tracks
  - Repeat one track
  - Shuffle play with Fisher-Yates algorithm

## Project Structure

- `index.html` - Main HTML document
- `style.css` - Styles for the player
- `script.js` - JavaScript logic with class-based architecture
  - `AudioController` - Manages audio playback and state
  - `UIController` - Handles the user interface updates
  - `TimeManagement` - Utility class for time conversions
- `assets/` - Contains images and audio files
  - `images/` - UI elements and track artwork
  - `audio/` - Music files for playback

## How to Run

1. Clone this repository
2. Open `index.html` in your browser
3. No build steps required - this is pure HTML, CSS, and JavaScript!

## Development Roadmap

This project follows an incremental development approach:

1. **Vanilla JS Base Implementation** - Basic player functionality
2. **OOP Refactoring** (current)- Restructuring code using Object-Oriented Programming principles
3. **Advanced Features** - Adding play modes (repeat one, repeat all, shuffle)
4. **Modular Architecture** - Breaking down the application into modules for better maintainability

## Branches

- `main` - Main project branch
- `vanilla-js` - Basic implementation using vanilla JavaScript
- `feature/oop-refactoring` - Current OOP implementation with advanced playback modes
- Future branches will explore modular architecture

## License

MIT
