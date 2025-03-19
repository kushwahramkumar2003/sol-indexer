Design a detailed Data Flow Diagram (DFD) for the Webhook Service within a blockchain indexing platform. This high-performance Rust service receives and processes webhooks from the Helius blockchain API.

Include these components and data flows:

1. Webhook registration process

   - Configuration intake from API Gateway
   - Registration with Helius API
   - Webhook configuration storage

2. Webhook receiving pipeline

   - Authentication and validation of incoming webhooks
   - Initial parsing and categorization
   - Rate limiting and backpressure mechanisms
   - Acknowledgment responses

3. Event processing handoff

   - Event buffering and batching
   - Routing to appropriate processors
   - Error handling and retry mechanisms
   - Dead letter queue for failed events

4. Monitoring and observability
   - Metric collection
   - Health checks
   - Log generation

Show all interfaces with external systems (Helius API), internal components (message queue, configuration store), and other services (Data Processing Service). Label all data flows with specific payload descriptions and processing steps.
