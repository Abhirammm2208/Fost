// orderPrioritization.js
import { OrderScheduler, ORDER_CONSTANTS } from '../../Components/algorithm/orderScheduling';

/**
 * Enhanced priority calculation that considers order simplicity
 */
export class EnhancedOrderScheduler extends OrderScheduler {
  constructor(orders, config = {}) {
    super(orders, {
      ...ORDER_CONSTANTS,
      PRIORITY_WEIGHTS: {
        ...ORDER_CONSTANTS.PRIORITY_WEIGHTS,
        // Additional weights for simplicity-based ordering
        SIMPLICITY_FACTOR: 2.0,
        ITEM_COMPLEXITY: {
          SINGLE_ITEM: 1,
          SMALL_ORDER: 1.5,
          MEDIUM_ORDER: 2,
          LARGE_ORDER: 3
        },
        // Time factors
        WAIT_TIME_FACTOR: 1.5,
        MAX_ACCEPTABLE_WAIT: 30 // minutes
      }
    });
  }

  /**
   * Calculate order complexity score
   * @private
   */
  calculateComplexityScore(order) {
    const itemCount = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const { ITEM_COMPLEXITY } = this.config.PRIORITY_WEIGHTS;

    // Determine complexity category
    if (itemCount === 1) return ITEM_COMPLEXITY.SINGLE_ITEM;
    if (itemCount <= 3) return ITEM_COMPLEXITY.SMALL_ORDER;
    if (itemCount <= 5) return ITEM_COMPLEXITY.MEDIUM_ORDER;
    return ITEM_COMPLEXITY.LARGE_ORDER;
  }

  /**
   * Calculate priority score with enhanced simplicity consideration
   * @override
   */
  calculatePriorityScore(order) {
    const baseScore = super.calculatePriorityScore(order);
    const {
      SIMPLICITY_FACTOR,
      WAIT_TIME_FACTOR,
      MAX_ACCEPTABLE_WAIT
    } = this.config.PRIORITY_WEIGHTS;

    // Calculate simplicity bonus (inverse of complexity)
    const complexityScore = this.calculateComplexityScore(order);
    const simplicityBonus = SIMPLICITY_FACTOR * (1 / complexityScore);

    // Calculate wait time factor
    const estimatedPrepTime = this.estimatePreparationTime(order);
    const waitTimePenalty = Math.max(0, estimatedPrepTime - MAX_ACCEPTABLE_WAIT) * WAIT_TIME_FACTOR;

    // Combine scores
    return baseScore + simplicityBonus - waitTimePenalty;
  }

  /**
   * Get optimal order sequence
   */
  getOptimalSequence() {
    const prioritizedOrders = this.prioritizeOrders();
    
    return prioritizedOrders.map(order => ({
      orderId: order.id,
      priority: this.calculatePriorityScore(order),
      estimatedPrepTime: this.estimatePreparationTime(order),
      complexity: this.calculateComplexityScore(order),
      itemCount: order.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      status: order.status
    }));
  }
}

/**
 * Helper function to update order modal with priority information
 */
export const enhanceOrderModalData = (order) => {
  const scheduler = new EnhancedOrderScheduler([order]);
  const priorityInfo = scheduler.getOptimalSequence()[0];
  
  return {
    ...order,
    priorityInfo: {
      score: Math.round(priorityInfo.priority * 100) / 100,
      estimatedPrepTime: priorityInfo.estimatedPrepTime,
      complexity: priorityInfo.complexity,
      recommendation: getOrderRecommendation(priorityInfo)
    }
  };
};

/**
 * Generate human-readable recommendation based on priority info
 */
function getOrderRecommendation(priorityInfo) {
  if (priorityInfo.complexity <= 1.5) {
    return "Quick order - Process immediately";
  } else if (priorityInfo.complexity <= 2) {
    return "Moderate complexity - Standard processing";
  } else {
    return "Complex order - May require additional preparation time";
  }
}