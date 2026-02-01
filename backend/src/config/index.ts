export const config = {
  port: parseInt(process.env.PORT || '3001', 10),

  aggregation: {
    minItemsToAggregate: 2,
    targetItemsToAggregate: 4,
    maxItemsToAggregate: 6,
    maxWaitTimeMs: 5 * 60 * 1000, // 5 minutes
    levelTimeMultiplier: 1.5,
  },

  apiKeyPrefix: 'clawswarm_',
};
