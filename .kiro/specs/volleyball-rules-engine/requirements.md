# Requirements Document

## Introduction

This feature implements a comprehensive volleyball rules engine that validates overlap and rotation faults at the moment of serve contact for indoor 6-on-6 volleyball. The system will provide a TypeScript library and API that, given on-court coordinates and rotation order, determines whether serving and receiving teams are legally positioned according to FIVB/NFHS/NCAA overlap rules. This rules engine will serve as a foundational validation system that can be integrated with the existing volleyball visualizer to provide real-time rule compliance feedback.

## Requirements

### Requirement 1

**User Story:** As a volleyball application developer, I want a rules engine that validates player positioning at serve contact, so that I can provide accurate rule compliance feedback and prevent invalid positioning in volleyball training and visualization tools.

#### Acceptance Criteria

1. WHEN given player coordinates and rotation data THEN the system SHALL determine if positioning is legal according to overlap rules
2. WHEN positioning violations exist THEN the system SHALL return detailed violation information with specific rule codes and affected players
3. WHEN all positioning is legal THEN the system SHALL return a clear indication of compliance
4. WHEN the server is positioned off-court in the service zone THEN the system SHALL allow this while still validating other players
5. WHEN validation is performed THEN the system SHALL use a 3cm tolerance (ε = 0.03m) to prevent floating-point precision issues
6. WHEN a player is being moved to a new position THEN the system SHALL provide real-time validation to prevent invalid positioning
7. WHEN drag operations are performed THEN the system SHALL constrain movement to only allow legal positioning relative to other players

### Requirement 2

**User Story:** As a volleyball coach using the rules engine, I want clear coordinate system definitions, so that I can accurately input player positions and understand validation results.

#### Acceptance Criteria

1. WHEN defining court coordinates THEN the system SHALL use a right-handed 2D system with net at y=0 and endline at y=9.0
2. WHEN positioning players THEN the system SHALL use x-coordinates from 0 (left sideline) to 9.0 (right sideline)
3. WHEN the server is serving THEN the system SHALL allow y-coordinates from 9.0 to 11.0 (service zone)
4. WHEN comparing positions THEN the system SHALL apply ±3cm tolerance to all inequality comparisons
5. WHEN coordinates are outside normal court bounds THEN the system SHALL handle service zone positioning appropriately

### Requirement 3

**User Story:** As a developer integrating the rules engine, I want comprehensive player state modeling, so that I can represent all necessary information for rule validation.

#### Acceptance Criteria

1. WHEN defining a player THEN the system SHALL require id, displayName, role, rotation slot, x/y coordinates, and server status
2. WHEN specifying rotation slots THEN the system SHALL use slots 1-6 corresponding to RB, RF, MF, LF, LB, MB positions
3. WHEN indicating player roles THEN the system SHALL support S, OPP, OH1, OH2, MB1, MB2, L, DS, and Unknown role types
4. WHEN validating a lineup THEN the system SHALL require exactly 6 players with unique slots and exactly one server
5. WHEN handling libero players THEN the system SHALL treat them as back-row players for overlap validation purposes

### Requirement 4

**User Story:** As a volleyball rules expert, I want the engine to correctly implement rotation neighbor relationships, so that overlap validation follows official volleyball positioning rules.

#### Acceptance Criteria

1. WHEN determining left/right neighbors THEN the system SHALL use circular ordering within rows: front (4-3-2), back (5-6-1)
2. WHEN identifying row counterparts THEN the system SHALL pair LF↔LB (4↔5), MF↔MB (3↔6), RF↔RB (2↔1)
3. WHEN calculating neighbor relationships THEN the system SHALL provide helper functions for left/right neighbors and row counterparts
4. WHEN determining row membership THEN the system SHALL correctly identify front-row (2,3,4) and back-row (1,5,6) slots
5. WHEN wrapping is needed THEN the system SHALL handle circular neighbor relationships within each row only

### Requirement 5

**User Story:** As a volleyball official, I want the rules engine to enforce proper overlap rules, so that positioning violations are detected accurately according to official regulations.

#### Acceptance Criteria

1. WHEN validating front row order THEN the system SHALL ensure LF is left of MF is left of RF (x coordinates increasing)
2. WHEN validating back row order THEN the system SHALL ensure LB is left of MB is left of RB (x coordinates increasing)
3. WHEN validating front/back relationships THEN the system SHALL ensure each front player is in front of their back counterpart (smaller y coordinate)
4. WHEN the server is positioned THEN the system SHALL exempt the server from overlap rules while validating all other players
5. WHEN multiple violations exist THEN the system SHALL detect and report all violations simultaneously

### Requirement 6

**User Story:** As a developer using the rules engine, I want detailed violation reporting, so that I can provide specific feedback about positioning errors to users.

#### Acceptance Criteria

1. WHEN row order violations occur THEN the system SHALL report ROW_ORDER violations with affected slot numbers
2. WHEN front/back violations occur THEN the system SHALL report FRONT_BACK violations with the conflicting pair
3. WHEN multiple servers are detected THEN the system SHALL report MULTIPLE violations with all server slots
4. WHEN violations are found THEN the system SHALL provide human-readable messages explaining each violation
5. WHEN no violations exist THEN the system SHALL return an empty violations array with isLegal=true

### Requirement 7

**User Story:** As a UI developer, I want helper functions for position labeling and drag constraints, so that I can create intuitive interfaces that prevent invalid positioning and display information clearly.

#### Acceptance Criteria

1. WHEN displaying slot information THEN the system SHALL provide slot labels (1=RB, 2=RF, 3=MF, 4=LF, 5=LB, 6=MB)
2. WHEN organizing positions THEN the system SHALL provide column mapping (Left/Middle/Right) for each slot
3. WHEN categorizing players THEN the system SHALL provide row mapping (Front/Back) for each slot
4. WHEN explaining violations THEN the system SHALL provide detailed explanation functions with coordinate information
5. WHEN dragging a player THEN the system SHALL calculate valid positioning bounds based on neighbor constraints
6. WHEN determining drop zones THEN the system SHALL provide functions to calculate allowable coordinate ranges for each player
7. WHEN constraining movement THEN the system SHALL account for server exemptions and current positions of other players

### Requirement 8

**User Story:** As a quality assurance engineer, I want comprehensive test coverage, so that I can ensure the rules engine works correctly across all scenarios and edge cases.

#### Acceptance Criteria

1. WHEN testing legal formations THEN the system SHALL pass all provided legal example lineups
2. WHEN testing each violation type THEN the system SHALL correctly identify LF/MF, MF/RF, LB/MB, MB/RB order violations and front/back violations
3. WHEN testing server exemptions THEN the system SHALL correctly handle servers in each of the six rotation slots
4. WHEN testing tolerance boundaries THEN the system SHALL handle positions within ±3cm correctly
5. WHEN testing libero scenarios THEN the system SHALL validate libero positioning in each back-row slot correctly

### Requirement 9

**User Story:** As a volleyball coach using the drag-and-drop interface, I want players to only be movable to legal positions, so that I cannot accidentally create invalid formations while positioning my team.

#### Acceptance Criteria

1. WHEN dragging a player THEN the system SHALL calculate and enforce valid coordinate boundaries in real-time
2. WHEN a player reaches a constraint boundary THEN the system SHALL prevent further movement in that direction
3. WHEN multiple constraints apply THEN the system SHALL enforce the most restrictive valid positioning area
4. WHEN the server is being positioned THEN the system SHALL allow movement to the service zone while exempting from overlap constraints
5. WHEN other players move THEN the system SHALL dynamically update constraint boundaries for all affected players
6. WHEN constraints would make positioning impossible THEN the system SHALL provide clear feedback about the conflict
7. WHEN releasing a player at an invalid position THEN the system SHALL snap the player to the nearest valid position within constraints
