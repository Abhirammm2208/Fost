// src/utils/orderScheduling.js

/**
 * Constants for order scheduling configuration
 */
export const ORDER_CONSTANTS = {
  PREPARATION_TIMES: {
    SANDWICH: 10,
    BURGER: 15,
    PIZZA: 20,
    SALAD: 8,
    COFFEE: 5,
    SMOOTHIE: 7,
    DESSERT: 12,
    DEFAULT: 15
  },
  PRIORITY_WEIGHTS: {
    TIME_FACTOR: 2,
    STATUS_WEIGHTS: {
      pending: 10,
      processing: 5,
      completed: 0,
      cancelled: -1,
      picked_up: -2
    },
    TOTAL_AMOUNT_FACTOR: 0.1,
    ITEM_COUNT_FACTOR: 0.5
  },
  TIME_THRESHOLDS: {
    PENDING_DELAY_HOURS: 1,
    PROCESSING_DELAY_HOURS: 0.5,
    PICKUP_WINDOW_MINUTES: 30,
    MAX_PREPARATION_TIME: 120
  }
};

/**
 * Represents an error in the order scheduling system
 */
export class OrderSchedulingError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'OrderSchedulingError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Manages order scheduling and prioritization
 */
export class OrderScheduler {
  constructor(orders, config = {}) {
    this.validateOrders(orders);
    this.orders = orders;
    this.config = { ...ORDER_CONSTANTS, ...config };
    this.preparationTimes = new Map();
  }
   
  scheduleOrders() {
    // Example logic: prioritize orders based on 'priority' property
    return this.orders.sort((a, b) => {
      const priorityLevels = { high: 3, medium: 2, low: 1 };
      return priorityLevels[b.priority] - priorityLevels[a.priority];
    });
  }
  /**
   * Validates the order data structure
   * @private
   */
  validateOrders(orders) {
    if (!Array.isArray(orders)) {
      throw new OrderSchedulingError(
        'Orders must be an array',
        'INVALID_ORDERS_FORMAT'
      );
    }

    orders.forEach((order, index) => {
      if (!order.id || !order.status || !order.createdAt || !Array.isArray(order.items)) {
        throw new OrderSchedulingError(
          'Invalid order format',
          'INVALID_ORDER_DATA',
          { orderIndex: index, orderId: order.id }
        );
      }
    });
  }

  /**
   * Calculates priority score for an order based on multiple factors
   * @private
   */
  calculatePriorityScore(order) {
    try {
      const {
        TIME_FACTOR,
        STATUS_WEIGHTS,
        TOTAL_AMOUNT_FACTOR,
        ITEM_COUNT_FACTOR
      } = this.config.PRIORITY_WEIGHTS;

      let score = 0;

      // Time-based priority
      const timeSinceCreation = Date.now() - order.createdAt.getTime();
      const hoursSinceCreation = timeSinceCreation / (1000 * 60 * 60);
      score += hoursSinceCreation * TIME_FACTOR;

      // Status-based priority
      score += STATUS_WEIGHTS[order.status] || 0;

      // Order value priority
      score += (order.total || 0) * TOTAL_AMOUNT_FACTOR;

      // Item count priority
      score += (order.items.length || 0) * ITEM_COUNT_FACTOR;

      // VIP customer priority (if applicable)
      if (order.customer?.isVIP) {
        score *= 1.5;
      }

      // Special instructions penalty
      if (order.specialInstructions) {
        score -= 2;
      }

      return score;
    } catch (error) {
      throw new OrderSchedulingError(
        'Error calculating priority score',
        'PRIORITY_CALCULATION_ERROR',
        { orderId: order.id, originalError: error.message }
      );
    }
  }

  /**
   * Prioritizes orders based on multiple factors
   */
  prioritizeOrders() {
    try {
      return [...this.orders].sort((a, b) => {
        const scoreA = this.calculatePriorityScore(a);
        const scoreB = this.calculatePriorityScore(b);
        return scoreB - scoreA;
      });
    } catch (error) {
      throw new OrderSchedulingError(
        'Error prioritizing orders',
        'PRIORITIZATION_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Estimates preparation time for an order
   */
  estimatePreparationTime(order) {
    try {
      // Check cache first
      if (this.preparationTimes.has(order.id)) {
        return this.preparationTimes.get(order.id);
      }

      let totalTime = 0;
      const { PREPARATION_TIMES } = this.config;

      // Calculate base preparation time
      order.items.forEach(item => {
        const itemType = item.type?.toUpperCase() || 'DEFAULT';
        const baseTime = PREPARATION_TIMES[itemType] || PREPARATION_TIMES.DEFAULT;
        const quantity = item.quantity || 1;
        
        // Apply quantity scaling factor (doesn't scale linearly)
        totalTime += baseTime * Math.log2(quantity + 1);
      });

      // Apply modifiers
      if (order.specialInstructions) totalTime *= 1.2;
      if (order.priority === 'rush') totalTime *= 0.8;
      if (order.items.length > 5) totalTime *= 1.1;

      // Consider kitchen load
      const simultaneousOrders = this.orders.filter(o => 
        o.status === 'processing' && 
        o.id !== order.id
      ).length;
      
      if (simultaneousOrders > 0) {
        totalTime *= (1 + (simultaneousOrders * 0.1));
      }

      // Apply bounds
      const finalTime = Math.min(
        Math.max(totalTime, 5),
        this.config.TIME_THRESHOLDS.MAX_PREPARATION_TIME
      );

      // Cache the result
      this.preparationTimes.set(order.id, finalTime);

      return finalTime;
    } catch (error) {
      throw new OrderSchedulingError(
        'Error estimating preparation time',
        'PREPARATION_TIME_ERROR',
        { orderId: order.id, originalError: error.message }
      );
    }
  }

  /**
   * Calculates pickup window for an order
   */
  calculatePickupWindow(order) {
    try {
      const preparationTime = this.estimatePreparationTime(order);
      const currentTime = new Date();
      
      // Calculate estimated ready time
      const estimatedReadyTime = new Date(
        currentTime.getTime() + (preparationTime * 60000)
      );

      // Calculate pickup window
      const latestPickupTime = new Date(
        estimatedReadyTime.getTime() + 
        (this.config.TIME_THRESHOLDS.PICKUP_WINDOW_MINUTES * 60000)
      );

      // Add buffer for busy periods
      const busyPeriodBuffer = this.calculateBusyPeriodBuffer(estimatedReadyTime);
      if (busyPeriodBuffer > 0) {
        estimatedReadyTime.setMinutes(estimatedReadyTime.getMinutes() + busyPeriodBuffer);
        latestPickupTime.setMinutes(latestPickupTime.getMinutes() + busyPeriodBuffer);
      }

      return {
        estimatedReadyTime,
        latestPickupTime,
        preparationTime,
        bufferApplied: busyPeriodBuffer
      };
    } catch (error) {
      throw new OrderSchedulingError(
        'Error calculating pickup window',
        'PICKUP_WINDOW_ERROR',
        { orderId: order.id, originalError: error.message }
      );
    }
  }

  /**
   * Calculates buffer time for busy periods
   * @private
   */
  calculateBusyPeriodBuffer(targetTime) {
    const hour = targetTime.getHours();
    const busyPeriods = [
      { start: 11, end: 14, buffer: 15 }, // Lunch rush
      { start: 17, end: 19, buffer: 10 }  // Dinner rush
    ];

    const activePeriod = busyPeriods.find(period => 
      hour >= period.start && hour <= period.end
    );

    return activePeriod ? activePeriod.buffer : 0;
  }

  /**
   * Detects potential delays and bottlenecks
   */
  detectPotentialDelays() {
    try {
      const currentTime = new Date();
      const delayedOrders = [];

      this.orders.forEach(order => {
        const hoursSinceCreation = 
          (currentTime - order.createdAt) / (1000 * 60 * 60);

        const isDelayed = 
          (order.status === 'pending' && 
           hoursSinceCreation > this.config.TIME_THRESHOLDS.PENDING_DELAY_HOURS) ||
          (order.status === 'processing' && 
           hoursSinceCreation > this.config.TIME_THRESHOLDS.PROCESSING_DELAY_HOURS);

        if (isDelayed) {
          const severity = hoursSinceCreation > 2 ? 'high' : 'medium';
          delayedOrders.push({
            order,
            hoursSinceCreation,
            severity,
            estimatedDelay: this.estimateDelay(order)
          });
        }
      });

      return delayedOrders;
    } catch (error) {
      throw new OrderSchedulingError(
        'Error detecting delays',
        'DELAY_DETECTION_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Estimates delay time for an order
   * @private
   */
  estimateDelay(order) {
    const { estimatedReadyTime } = this.calculatePickupWindow(order);
    const currentTime = new Date();
    return Math.max(0, (estimatedReadyTime - currentTime) / (1000 * 60));
  }
}

/**
 * Generates detailed notifications for delayed orders
 */
export const generateDelayNotifications = (delayedOrders) => {
  return delayedOrders.map(({ order, hoursSinceCreation, severity, estimatedDelay }) => {
    const baseMessage = `Order #${order.id.slice(-6)} is experiencing delays`;
    const timeMessage = `(${Math.round(hoursSinceCreation * 60)} minutes old)`;
    const delayMessage = estimatedDelay > 0 
      ? `. Estimated additional delay: ${Math.round(estimatedDelay)} minutes`
      : '';
    const actionMessage = severity === 'high' 
      ? ' - Immediate attention required!'
      : ' - Please prioritize';

    return {
      orderId: order.id,
      message: `${baseMessage} ${timeMessage}${delayMessage}${actionMessage}`,
      severity,
      timestamp: new Date(),
      estimatedDelay,
      hoursSinceCreation
    };
  });
};

/**
 * Analyzes kitchen capacity and workload
 */
export const analyzeKitchenWorkload = (orders) => {
  const activeOrders = orders.filter(order => 
    ['pending', 'processing'].includes(order.status)
  );

  const totalItems = activeOrders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0), 
    0
  );

  const complexityScore = activeOrders.reduce((sum, order) => 
    sum + order.items.length * (order.specialInstructions ? 1.5 : 1), 
    0
  );

  return {
    activeOrderCount: activeOrders.length,
    totalItems,
    complexityScore,
    workloadLevel: calculateWorkloadLevel(activeOrders.length, complexityScore),
    recommendedActions: generateWorkloadRecommendations(activeOrders.length, complexityScore)
  };
};

/**
 * Calculates workload level based on order metrics
 * @private
 */
function calculateWorkloadLevel(orderCount, complexityScore) {
  const workloadScore = (orderCount * 10) + (complexityScore * 5);
  if (workloadScore > 100) return 'critical';
  if (workloadScore > 70) return 'high';
  if (workloadScore > 40) return 'moderate';
  return 'normal';
}

/**
 * Generates recommendations based on workload
 * @private
 */
function generateWorkloadRecommendations(orderCount, complexityScore) {
  const recommendations = [];
  const workloadScore = (orderCount * 10) + (complexityScore * 5);

  if (workloadScore > 100) {
    recommendations.push(
      'Consider temporarily pausing new orders',
      'Call in additional staff if available',
      'Focus on completing simple orders first to reduce queue'
    );
  } else if (workloadScore > 70) {
    recommendations.push(
      'Prepare for potential staff reallocation',
      'Review and prioritize orders by complexity',
      'Consider extending estimated preparation times'
    );
  }

  return recommendations;
}