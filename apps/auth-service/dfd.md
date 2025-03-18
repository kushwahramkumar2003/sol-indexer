Create a detailed Data Flow Diagram (DFD) for the Authentication Service within a blockchain indexing platform. This Rust-based microservice handles all user authentication, authorization, and profile management.

Include the following components and flows:

1. User registration process

   - Input validation
   - User data storage
   - Email verification flow
   - Initial role assignment

2. Authentication processes

   - Login flow with credential validation
   - JWT token generation and validation
   - Refresh token mechanism
   - Session management

3. User profile management

   - Profile data updates
   - Permission changes
   - Password reset workflow

4. Integration points with other services
   - API Gateway interactions
   - Database service connections
   - Event publications for user-related events

Include all data stores (user database, token cache), external systems (email service), internal modules (password hasher, token manager), and clear labels for all data flows. Use level-1 DFD notation with processes, external entities, data stores, and data flows.
