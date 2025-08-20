# Implementation Plan

- [x] 1. Create core data structures and type definitions

  - Define PlayerState, RotationSlot, Role, and coordinate system interfaces in TypeScript
  - Create OverlapResult, Violation, and PositionBounds interfaces for validation results
  - Implement COORDINATE_SYSTEM constants with court dimensions and tolerance values
  - Write basic type guards and validation functions for type safety
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_

- [x] 2. Implement coordinate system transformation utilities

  - Create CoordinateTransformer class with bidirectional conversion between screen (600x360) and volleyball (9x9m) coordinates
  - Implement coordinate validation functions for court boundaries and service zone
  - Add tolerance-aware comparison utilities (ToleranceUtils) with 3cm epsilon handling
  - Write coordinate normalization and bounds checking functions
  - Create unit tests for all coordinate transformation and validation functions
  - _Requirements: 2.1, 2.2, 2.4, 1.5_

- [x] 3. Build rotation neighbor relationship calculator

  - Implement NeighborCalculator class with methods for left/right neighbors within rows
  - Create getRowCounterpart function mapping front/back pairs (LF↔LB, MF↔MB, RF↔RB)
  - Add isFrontRow and isBackRow helper functions for slot categorization
  - Implement circular neighbor logic for front row (4→3→2) and back row (5→6→1)
  - Write comprehensive unit tests covering all neighbor relationships and edge cases
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Create core overlap validation engine

  - Implement OverlapValidator class with main checkOverlap function
  - Add input validation for lineup (6 players, unique slots, exactly 1 server)
  - Create validateFrontRowOrder function enforcing LF < MF < RF with tolerance
  - Create validateBackRowOrder function enforcing LB < MB < RB with tolerance
  - Implement validateFrontBackOrder function ensuring front players are in front of back counterparts
  - Add server exemption logic throughout all validation functions
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5. Implement detailed violation reporting and messaging

  - Create violation detection functions that return specific Violation objects with codes and affected slots
  - Implement human-readable message generation for each violation type (ROW_ORDER, FRONT_BACK, MULTIPLE_SERVERS)
  - Add coordinate information to violations for UI highlighting and debugging
  - Create explainViolation function that generates detailed explanations with player names and positions
  - Write unit tests for all violation types and message generation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6. Build real-time constraint calculation system

  - Implement ConstraintCalculator class with calculateValidBounds function
  - Create constraint logic for left/right neighbor positioning with tolerance
  - Add front/back counterpart constraint calculations
  - Implement server exemption handling in constraint calculations
  - Create isPositionValid function for real-time drag validation
  - Add snapToValidPosition function for invalid position correction
  - _Requirements: 1.6, 1.7, 7.5, 7.6, 7.7, 9.1, 9.2, 9.3_

- [ ] 7. Implement dynamic constraint boundary enforcement

  - Create constraint boundary calculation that updates when other players move
  - Add logic to handle multiple overlapping constraints (most restrictive wins)
  - Implement constraint conflict detection and resolution
  - Create visual feedback data for constraint boundaries (min/max x/y values)
  - Add constraint reason tracking for user feedback about positioning limitations
  - Write integration tests for dynamic constraint updates during multi-player movement
  - _Requirements: 9.4, 9.5, 9.6, 9.7_

- [ ] 8. Create position labeling and helper utilities

  - Implement PositionHelpers class with slot labeling functions (1=RB, 2=RF, etc.)
  - Add getSlotColumn function returning Left/Middle/Right for each slot
  - Create getSlotRow function returning Front/Back for each slot
  - Implement position description functions for user-friendly display
  - Add formation analysis helpers for identifying position patterns
  - Write unit tests for all helper functions and edge cases
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 9. Integrate with existing coordinate system and components

  - Create StateConverter class for bidirectional conversion between screen and volleyball coordinates
  - Modify existing DraggablePlayer component to use constraint boundaries during drag operations
  - Enhance PositionManager to integrate validation and constraint calculation
  - Add validation result display components for showing violations and explanations
  - Create coordinate system migration utilities for existing position data
  - _Requirements: 1.6, 1.7, 9.1, 9.2, 9.7_

- [ ] 10. Implement performance optimizations and caching

  - Add constraint calculation memoization with cache invalidation on position changes
  - Implement incremental validation that only recalculates affected constraints
  - Create efficient data structures for neighbor lookups and constraint queries
  - Add lazy evaluation for detailed violation information generation
  - Optimize coordinate transformations with pre-calculated scaling factors
  - Write performance tests and benchmarks for large-scale position updates
  - _Requirements: 1.5, 9.5_

- [ ] 11. Create comprehensive test suite covering all scenarios

  - Write unit tests for all legal formation examples from requirements
  - Create tests for each specific violation type (LF/MF, MF/RF, LB/MB, MB/RB, front/back)
  - Add server exemption tests for each rotation slot with borderline tolerance cases
  - Implement libero positioning tests for each back-row slot
  - Create fuzz tests with random position perturbations (±2cm legal, ±10cm violations)
  - Add integration tests for complete drag-and-drop workflows with constraint enforcement
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Build public API and documentation
  - Create main VolleyballRulesEngine class with clean public API surface
  - Implement convenience functions for common validation and constraint operations
  - Add comprehensive JSDoc documentation for all public methods and interfaces
  - Create usage examples and integration guides for consuming applications
  - Write README with coordinate system explanation, rule descriptions, and API reference
  - Add TypeScript declaration files for proper IDE support and type checking
  - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4_
