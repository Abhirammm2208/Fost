import React, { useEffect, useRef } from 'react';

const OrderAlert = ({ orders }) => {
  const prevOrdersRef = useRef([]);

  useEffect(() => {
    // Skip the first render
    if (prevOrdersRef.current.length === 0) {
      prevOrdersRef.current = orders;
      return;
    }

    // Check for new orders
    const prevOrderIds = new Set(prevOrdersRef.current.map(order => order.id));
    const newOrders = orders.filter(order => 
      !prevOrderIds.has(order.id) && 
      (order.status === 'pending' || order.status === 'new')
    );

    // Play sound if there are new orders
    if (newOrders.length > 0) {
      // Create and play audio
      const audio = new Audio();
      audio.src = 'https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3';
      
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.error('Error playing sound:', error);
        });
      }
    }

    // Update reference
    prevOrdersRef.current = orders;
  }, [orders]);

  return null;
};

export default OrderAlert;