# Requirements Document

## Introduction

This feature enables coaches to customize player positioning for each rotation across all three formation types (rotational position, serve/receive, and base attack). The system will allow drag-and-drop positioning of players, persist these configurations locally, and generate shareable URLs that preserve all positioning data. This transforms the visualizer from a static demonstration tool into a dynamic coaching platform where coaches can create, save, and share their specific team formations and strategies.

## Requirements

### Requirement 1

**User Story:** As a volleyball coach, I want to drag and drop players to custom positions on the court, so that I can create formations that match my team's specific strategy and player capabilities.

#### Acceptance Criteria

1. WHEN a coach clicks and drags a player dot THEN the system SHALL allow the player to be moved to any valid position on the court
2. WHEN a player is being dragged THEN the system SHALL provide visual feedback showing the current position and valid drop zones
3. WHEN a player is dropped in a valid position THEN the system SHALL update the player's position immediately and save the change
4. WHEN a player is dropped in an invalid position THEN the system SHALL return the player to their previous valid position
5. WHEN positioning changes are made THEN the system SHALL maintain the changes across rotation transitions

### Requirement 2

**User Story:** As a volleyball coach, I want my custom positioning to be saved automatically, so that I don't lose my work when I refresh the page or return later.

#### Acceptance Criteria

1. WHEN a coach makes positioning changes THEN the system SHALL automatically save all position data to browser storage
2. WHEN a coach returns to the application THEN the system SHALL restore all previously saved custom positions
3. WHEN position data is saved THEN the system SHALL store positions for all six rotations and all three formation types
4. WHEN storage is full or unavailable THEN the system SHALL gracefully handle the error and notify the user
5. WHEN clearing data is requested THEN the system SHALL provide a way to reset all positions to defaults

### Requirement 3

**User Story:** As a volleyball coach, I want to generate shareable URLs that contain my custom formations, so that I can share specific rotations and positioning with my team or other coaches.

#### Acceptance Criteria

1. WHEN a coach requests a shareable URL THEN the system SHALL generate a URL containing all current position data
2. WHEN someone visits a shared URL THEN the system SHALL load and display the exact positioning from that URL
3. WHEN URL parameters contain position data THEN the system SHALL override any locally saved positions with the URL data
4. WHEN sharing a specific rotation THEN the system SHALL include data for all formation types of that rotation
5. WHEN the URL becomes too long THEN the system SHALL use URL-safe compression or encoding to maintain shareability

### Requirement 4

**User Story:** As a volleyball coach, I want to customize positions for each formation type independently, so that I can show different positioning strategies for serve/receive versus base attack situations.

#### Acceptance Criteria

1. WHEN switching between formation types THEN the system SHALL maintain separate position data for rotational, serve/receive, and base formations
2. WHEN a player is moved in one formation type THEN the system SHALL not affect their position in other formation types
3. WHEN viewing different formation types THEN the system SHALL display the correct saved positions for each type
4. WHEN sharing URLs THEN the system SHALL include position data for all three formation types
5. WHEN resetting positions THEN the system SHALL allow resetting individual formation types or all types together

### Requirement 5

**User Story:** As a volleyball coach, I want visual indicators showing which positions have been customized, so that I can easily identify which formations use default versus custom positioning.

#### Acceptance Criteria

1. WHEN a position has been customized THEN the system SHALL provide a visual indicator (different color, border, or icon) on the player dot
2. WHEN viewing formation controls THEN the system SHALL show which rotations and formation types have custom positioning
3. WHEN hovering over customized positions THEN the system SHALL display additional information about the customization
4. WHEN comparing formations THEN the system SHALL clearly distinguish between default and custom positions
5. WHEN resetting is available THEN the system SHALL provide clear options to reset individual positions or entire formations

### Requirement 6

**User Story:** As a team member receiving a shared URL, I want to view the custom formations without needing to make changes, so that I can study the positioning without accidentally modifying the coach's work.

#### Acceptance Criteria

1. WHEN accessing a shared URL THEN the system SHALL provide a read-only viewing mode option
2. WHEN in read-only mode THEN the system SHALL disable drag-and-drop functionality while maintaining all other visualization features
3. WHEN viewing shared formations THEN the system SHALL clearly indicate this is a shared configuration
4. WHEN wanting to make changes to shared formations THEN the system SHALL provide an option to "make editable copy"
5. WHEN copying shared formations THEN the system SHALL create a new local version without affecting the original shared URL
