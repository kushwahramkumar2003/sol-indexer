Create a comprehensive Data Flow Diagram (DFD) for the Data Processing Service within a blockchain indexing platform. This Rust-based service transforms blockchain events into structured data for storage in user databases.

Detail the following components and flows:

1. Event intake process

   - Message queue consumption
   - Event validation and parsing
   - Processing priority determination

2. Data transformation pipeline

   - Blockchain-specific decoders (NFT, token, transaction)
   - User-specific transformation rules
   - Enrichment with additional data
   - Normalization and standardization

3. Database operations

   - Write operation preparation
   - Batching and optimization
   - Schema validation
   - Transaction management

4. Failure handling and recovery

   - Error classification
   - Retry mechanisms
   - Dead letter handling
   - Alert generation

Include all internal components (transformation engines, decoders, validators), data stores (processing state, configuration cache), and connections to other services (Database Service, Monitoring). Use different colors to distinguish between different data types being processed (NFT data, token prices, transaction data) and clearly label all transformation steps.
